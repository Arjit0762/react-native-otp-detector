package expo.modules.otpdetector

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.google.android.gms.auth.api.phone.SmsRetriever
import com.google.android.gms.common.api.CommonStatusCodes
import com.google.android.gms.common.api.Status

/**
 * Shared receiver for both the SMS User Consent API and the SMS Retriever API.
 * Both deliver results through the same [SmsRetriever.SMS_RETRIEVED_ACTION] broadcast;
 * the difference is what the SUCCESS extras contain:
 *  - Retriever: the message text directly ([SmsRetriever.EXTRA_SMS_MESSAGE]).
 *  - Consent:   an intent to launch for user approval ([SmsRetriever.EXTRA_CONSENT_INTENT]).
 */
class ReactNativeOtpDetectorBroadcast(
    private val onConsentIntent: (Intent) -> Unit,
    private val onSmsMessage: (String) -> Unit,
    private val onError: (String) -> Unit
) : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (SmsRetriever.SMS_RETRIEVED_ACTION != intent.action) {
            Log.d("SmsBroadcastReceiver", "Received unexpected action: ${intent.action}")
            return
        }

        val extras = intent.extras ?: return
        val status = extras.get(SmsRetriever.EXTRA_STATUS) as? Status ?: return

        when (status.statusCode) {
            CommonStatusCodes.SUCCESS -> {
                val message = extras.getString(SmsRetriever.EXTRA_SMS_MESSAGE)
                @Suppress("DEPRECATION")
                val consentIntent = extras.getParcelable<Intent>(SmsRetriever.EXTRA_CONSENT_INTENT)
                when {
                    // Retriever API: full message is delivered directly.
                    message != null -> onSmsMessage(message)
                    // Consent API: launch the consent dialog to get the message.
                    consentIntent != null -> onConsentIntent(consentIntent)
                    else -> onError("SMS broadcast succeeded but contained no message or consent intent")
                }
            }

            CommonStatusCodes.TIMEOUT -> onError("SMS retrieval timed out (5 minute window elapsed)")

            else -> onError("SMS retrieval failed with status code: ${status.statusCode}")
        }
    }
}
