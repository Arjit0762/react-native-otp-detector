package expo.modules.otpreader

import android.app.Activity
import android.content.Intent
import android.content.IntentFilter
import android.util.Log
import com.google.android.gms.auth.api.phone.SmsRetriever
import com.google.android.gms.auth.api.phone.SmsRetrieverClient
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

import android.os.Build
import android.content.Context

class ReactNativeOtpReaderModule : Module() {
    private var smsReceiver: ReactNativeOtpReaderBroadcast? = null

    override fun definition() = ModuleDefinition {
        Name("ReactNativeOtpReader")

        Function("startSmsConsent") {
            val activity = appContext.activityProvider?.currentActivity
                ?: throw Exception("Activity is null")

            val client: SmsRetrieverClient = SmsRetriever.getClient(activity)
            val task = client.startSmsUserConsent(null)

            task.addOnSuccessListener {
                Log.d("SmsConsent", "Started SMS consent listener")

                // Register BroadcastReceiver dynamically
                smsReceiver = ReactNativeOtpReaderBroadcast { intent ->
                    Log.d("SmsConsent", "Received Consent Intent, launching user consent")
                    activity.startActivityForResult(intent, 12345)
                }
        

                val intentFilter = IntentFilter(SmsRetriever.SMS_RETRIEVED_ACTION)
                Log.d("IntentFilter", "Intent filter created: $intentFilter")

                try {
                   
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) { // Android 13+
                        Log.d("SmsReceiver", "Registering receiver with RECEIVER_NOT_EXPORTED for Android 13+")
                        activity.registerReceiver(smsReceiver, intentFilter, Context.RECEIVER_EXPORTED)
                    } else {
                        Log.d("SmsReceiver", "Registering receiver normally for Android <13")
                        activity.registerReceiver(smsReceiver, intentFilter)
                    }
                    
                    Log.d("SmsReceiver", "Broadcast receiver registered successfully")
                } catch (e: Exception) {
                    Log.e("SmsReceiver", "Error while registering BroadcastReceiver: ${e.message}", e)
                }
            }
        }

        Events("onSmsReceived")

        OnActivityResult { activity, payload ->
            val requestCode = payload.requestCode
            val resultCode = payload.resultCode
            val data: Intent? = payload.data
        
            if (data != null) {
                Log.d("AppActivity", "Received intent: ${data.toUri(Intent.URI_INTENT_SCHEME)}")
        
                if (requestCode == 12345 && resultCode == Activity.RESULT_OK) {
                    val message = data.getStringExtra(SmsRetriever.EXTRA_SMS_MESSAGE) ?: ""
                    
                    // Ensure the message is not empty and contains an OTP
                    val otpRegex = Regex("\\b\\d{6}\\b") // Matches a 6-digit OTP
                    val extractedOtp = otpRegex.find(message)?.value
        
                    if (!message.isNullOrEmpty() && extractedOtp != null) {
                        Log.d("AppActivity", "Extracted OTP message: $message")
                        sendEvent("onSmsReceived", mapOf("otp" to extractedOtp))
                        unregisterReceiver()
                    } else {
                        Log.e("AppActivity", "SMS does not contain a valid OTP")
                    }
                } else {
                    Log.e("AppActivity", "Invalid requestCode ($requestCode) or resultCode ($resultCode)")
                }
            } else {
                Log.e("App Change Log", "No data received from SMS Retriever")
            }
        }        
    }

    private fun unregisterReceiver() {
        val activity = appContext.activityProvider?.currentActivity
        if (smsReceiver != null && activity != null) {
            try {
                activity.unregisterReceiver(smsReceiver)
                Log.d("SmsReceiver", "Broadcast receiver unregistered")
            } catch (e: IllegalArgumentException) {
                Log.w("SmsReceiver", "Broadcast receiver was not registered")
            } catch (e: Exception) {
                Log.e("SmsReceiver", "Error unregistering receiver: ${e.message}", e)
            }
            smsReceiver = null
        }
    }

    private fun extractOtp(message: String, regex: String): String {
        val otpRegex = Regex(regex)
        return otpRegex.find(message)?.value ?: ""
    }

    private fun getOtpRegex(arguments: Map<String, Any?>?): String {
        var regex = "\\d{6}" // Default 6 digit regex
        if (arguments != null) {
            val otpLength = arguments["otpLength"] as? Int
            val customRegex = arguments["otpRegex"] as? String

            if (customRegex != null && customRegex.isNotEmpty()) {
                regex = customRegex
            } else if (otpLength != null && otpLength > 0) {
                regex = "\\d{$otpLength}"
            }
        }
        return regex
    }
}
