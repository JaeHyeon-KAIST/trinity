//
//  TrinityApp.swift
//  Trinity Watch App
//
//  Created by JaeHyeon Lee on 11/23/24.
//

import SwiftUI

@main
struct Trinity_Watch_AppApp: App {
    @WKExtensionDelegateAdaptor(ExtensionDelegate.self) var extensionDelegate
  
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
