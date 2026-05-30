require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'SaintsLockScreenTime'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = 'SaintsLock'
  s.homepage       = 'https://saintslock.netlify.app'
  s.platforms      = {
    :ios => '16.0'
  }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://example.com/saintslock-screen-time.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = '**/*.{h,m,swift}'
end
