require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ReactNativeOtpDetector'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.4'
  s.source         = { git: 'https://github.com/Arjit222830/react-native-otp-detector' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Ensure compatibility with iOS, even though functionality is Android-only
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "ios/**/*.{h,m,mm,swift}"
end
