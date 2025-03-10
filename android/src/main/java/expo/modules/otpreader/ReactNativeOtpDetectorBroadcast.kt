package expo.modules.otpdetector

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.google.android.gms.auth.api.phone.SmsRetriever
import com.google.android.gms.common.api.CommonStatusCodes
import com.google.android.gms.common.api.Status

class ReactNativeOtpDetectorBroadcast(private val callback: (Intent?) -> Unit) : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
    
        if (SmsRetriever.SMS_RETRIEVED_ACTION == intent.action) {
    
            val extras = intent.extras
            if (extras == null) {
                return
            }
    
            val smsRetrieverStatus = extras.get(SmsRetriever.EXTRA_STATUS) as? Status
            if (smsRetrieverStatus == null) {
                return
            }
    
            when (smsRetrieverStatus.statusCode) {
                CommonStatusCodes.SUCCESS -> {
    
                    val consentIntent = extras?.getParcelable<Intent>(SmsRetriever.EXTRA_CONSENT_INTENT)
                    if (consentIntent != null) {
                        callback(consentIntent)
                    } else {
                        Log.e("SmsBroadcastReceiver", "Consent Intent is null")
                    }
                }
    
                CommonStatusCodes.TIMEOUT -> {
                    Log.e("SmsBroadcastReceiver", "SMS retrieval timed out")
                }
    
                else -> {
                    Log.e("SmsBroadcastReceiver", "Unknown status code: ${smsRetrieverStatus.statusCode}")
                }
            }
        } else {
            Log.d("SmsBroadcastReceiver", "Received unexpected action: ${intent.action}")
        }
    }
    
}
