package expo.modules.otpdetector

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.content.pm.Signature
import android.os.Build
import android.util.Base64
import android.util.Log
import com.google.android.gms.auth.api.phone.SmsRetriever
import com.google.android.gms.auth.api.phone.SmsRetrieverClient
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.security.NoSuchAlgorithmException

private const val TAG = "ReactNativeOtpDetector"
private const val CONSENT_REQUEST_CODE = 12345

// App-signature-hash constants (see https://developers.google.com/identity/sms-retriever/verify)
private const val HASH_TYPE = "SHA-256"
private const val NUM_HASHED_BYTES = 9
private const val NUM_BASE64_CHAR = 11

class ReactNativeOtpDetectorModule : Module() {
    private var smsReceiver: ReactNativeOtpDetectorBroadcast? = null
    // The exact Activity the receiver was registered on — we must unregister against this
    // same instance, not whatever currentActivity happens to be at unregister time.
    private var receiverActivity: Activity? = null
    // Regex used to pull the OTP out of the received message. Set when a listen is started.
    private var activeOtpRegex: String = "\\d{4,8}"
    // True once this module's AppContext is gone (a JS reload, e.g. an OTA update). Play
    // services can still answer a start*() made just before that, and the SMS for it can
    // still arrive; neither may register a receiver on, or send an event from, a module
    // that no longer belongs to a context.
    @Volatile private var destroyed = false

    override fun definition() = ModuleDefinition {
        Name("ReactNativeOtpDetector")

        Events("onSmsReceived", "onOtpError")

        // SMS User Consent API — shows a one-tap consent dialog. No app hash required.
        // `senderPhoneNumber` (optional) restricts which sender triggers the prompt.
        Function("startSmsConsent") { options: Map<String, Any?>? ->
            activeOtpRegex = getOtpRegex(options)
            val activity = currentActivityOrThrow()
            val sender = options?.get("senderPhoneNumber") as? String
            val client: SmsRetrieverClient = SmsRetriever.getClient(activity)
            client.startSmsUserConsent(sender)
                .addOnSuccessListener { registerReceiver(activity) }
                .addOnFailureListener { e -> sendError("Failed to start SMS consent: ${e.message}") }
            Unit
        }

        // SMS Retriever API — fully automatic, no UI. The SMS must contain the 11-char
        // app signature hash (see getAppSignatureHash) and follow Google's message format.
        Function("startSmsRetriever") { options: Map<String, Any?>? ->
            activeOtpRegex = getOtpRegex(options)
            val activity = currentActivityOrThrow()
            val client: SmsRetrieverClient = SmsRetriever.getClient(activity)
            client.startSmsRetriever()
                .addOnSuccessListener { registerReceiver(activity) }
                .addOnFailureListener { e -> sendError("Failed to start SMS retriever: ${e.message}") }
            Unit
        }

        // Returns the 11-character app signature hash(es) to append to your SMS for the
        // Retriever API. There is one per signing certificate (debug vs. release differ).
        Function("getAppSignatureHash") {
            val context = appContext.reactContext ?: throw Exception("React context is null")
            return@Function getAppSignatures(context)
        }

        // Manually stop listening and unregister the broadcast receiver.
        Function("stopListening") {
            unregisterReceiver()
        }

        // Consent flow only: the user-approved message comes back through the activity result.
        OnActivityResult { _, payload ->
            if (payload.requestCode != CONSENT_REQUEST_CODE) {
                return@OnActivityResult
            }
            if (payload.resultCode == Activity.RESULT_OK && payload.data != null) {
                val message = payload.data?.getStringExtra(SmsRetriever.EXTRA_SMS_MESSAGE) ?: ""
                handleMessage(message)
            } else {
                sendError("User denied SMS consent or no message was returned")
            }
            unregisterReceiver()
        }

        OnDestroy {
            destroyed = true
            unregisterReceiver()
        }
    }

    private fun currentActivityOrThrow(): Activity =
        appContext.activityProvider?.currentActivity ?: throw Exception("Activity is null")

    private fun registerReceiver(activity: Activity) {
        // start*() resolved after the module was destroyed: nobody is left to listen.
        if (destroyed) return
        // Never keep two receivers registered at once.
        unregisterReceiver()

        val receiver = ReactNativeOtpDetectorBroadcast(
            onConsentIntent = { intent ->
                try {
                    activity.startActivityForResult(intent, CONSENT_REQUEST_CODE)
                } catch (e: Exception) {
                    sendError("Failed to launch consent dialog: ${e.message}")
                    unregisterReceiver()
                }
            },
            onSmsMessage = { message ->
                handleMessage(message)
                unregisterReceiver()
            },
            onError = { message ->
                sendError(message)
                unregisterReceiver()
            }
        )
        smsReceiver = receiver

        val intentFilter = IntentFilter(SmsRetriever.SMS_RETRIEVED_ACTION)
        // Gate the (exported) receiver on the SEND permission, which only Google Play services
        // holds. Without it, any installed app could broadcast a forged SMS_RETRIEVED intent with
        // a fake OTP and have it accepted. See Google's official SMS Retriever manifest sample.
        val sendPermission = "com.google.android.gms.auth.api.phone.permission.SEND"
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) { // Android 13+
                activity.registerReceiver(receiver, intentFilter, sendPermission, null, Context.RECEIVER_EXPORTED)
            } else {
                activity.registerReceiver(receiver, intentFilter, sendPermission, null)
            }
            receiverActivity = activity
            Log.d(TAG, "Broadcast receiver registered successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Error while registering BroadcastReceiver: ${e.message}", e)
            sendError("Failed to register SMS receiver: ${e.message}")
            smsReceiver = null
            receiverActivity = null
        }
    }

    private fun unregisterReceiver() {
        val receiver = smsReceiver ?: return
        try {
            // Unregister against the same Activity we registered on (not currentActivity).
            receiverActivity?.unregisterReceiver(receiver)
        } catch (e: IllegalArgumentException) {
            Log.w(TAG, "Broadcast receiver was not registered")
        } catch (e: Exception) {
            Log.e(TAG, "Error unregistering receiver: ${e.message}", e)
        }
        receiverActivity = null
        smsReceiver = null
    }

    private fun handleMessage(message: String) {
        val otp = extractOtp(message, activeOtpRegex)
        if (otp.isNotEmpty()) {
            emit("onSmsReceived", mapOf("otp" to otp, "message" to message))
        } else {
            sendError("No OTP matching /$activeOtpRegex/ found in message")
        }
    }

    private fun sendError(message: String) {
        Log.e(TAG, message)
        emit("onOtpError", mapOf("message" to message))
    }

    // sendEvent throws once the AppContext has been destroyed ("module ... isn't present in
    // the module registry"). Here that would be inside BroadcastReceiver.onReceive, which
    // takes the whole app down, so an event with no context left to receive it is dropped.
    private fun emit(name: String, body: Map<String, Any?>) {
        if (destroyed) return
        try {
            sendEvent(name, body)
        } catch (e: Exception) {
            Log.w(TAG, "Dropped $name: ${e.message}")
        }
    }

    private fun extractOtp(message: String, regex: String): String {
        return try {
            Regex(regex).find(message)?.value ?: ""
        } catch (e: Exception) {
            Log.e(TAG, "Invalid OTP regex /$regex/: ${e.message}")
            ""
        }
    }

    private fun getOtpRegex(arguments: Map<String, Any?>?): String {
        if (arguments != null) {
            val customRegex = arguments["otpRegex"] as? String
            if (!customRegex.isNullOrEmpty()) {
                return customRegex
            }
            // Numbers can arrive as Int or Double across the JS bridge.
            val otpLength = (arguments["otpLength"] as? Number)?.toInt()
            if (otpLength != null && otpLength > 0) {
                return "\\d{$otpLength}"
            }
        }
        return "\\d{4,8}" // Default: any 4-8 digit code.
    }

    // ---- App signature hash (SMS Retriever API) ----

    private fun getAppSignatures(context: Context): List<String> {
        val signatures = ArrayList<String>()
        try {
            val packageName = context.packageName
            val pm = context.packageManager
            val signatureList: Array<Signature> = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                val packageInfo = pm.getPackageInfo(packageName, PackageManager.GET_SIGNING_CERTIFICATES)
                packageInfo.signingInfo?.apkContentsSigners ?: emptyArray()
            } else {
                @Suppress("DEPRECATION")
                val packageInfo = pm.getPackageInfo(packageName, PackageManager.GET_SIGNATURES)
                @Suppress("DEPRECATION")
                packageInfo.signatures ?: emptyArray()
            }

            for (signature in signatureList) {
                val hash = hash(packageName, signature.toCharsString())
                if (hash != null) {
                    signatures.add(hash)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Unable to get app signature hash: ${e.message}", e)
        }
        return signatures
    }

    private fun hash(packageName: String, signature: String): String? {
        val appInfo = "$packageName $signature"
        return try {
            val messageDigest = MessageDigest.getInstance(HASH_TYPE)
            messageDigest.update(appInfo.toByteArray(StandardCharsets.UTF_8))
            var hashSignature = messageDigest.digest()
            // Truncate to the first 9 bytes, then base64-encode and take the first 11 chars.
            hashSignature = hashSignature.copyOfRange(0, NUM_HASHED_BYTES)
            var base64Hash = Base64.encodeToString(hashSignature, Base64.NO_PADDING or Base64.NO_WRAP)
            base64Hash = base64Hash.substring(0, NUM_BASE64_CHAR)
            base64Hash
        } catch (e: NoSuchAlgorithmException) {
            Log.e(TAG, "No such algorithm $HASH_TYPE: ${e.message}", e)
            null
        }
    }
}
