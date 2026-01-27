// ==UserScript==
// @name         Netflix Auto-Login
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically login to Netflix using credentials from localStorage
// @author       You
// @match        https://www.netflix.com/login
// @match        https://www.netflix.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';
    
    // Mark userscript as installed
    try {
        localStorage.setItem('netflix_userscript_installed', 'true');
    } catch(e) {}
    
    console.log('Netflix Auto-Login Userscript loaded');
    
    // Get credentials from localStorage (set by our React app)
    const email = localStorage.getItem('netflix_auto_email');
    const password = localStorage.getItem('netflix_auto_password');
    
    if (!email || !password) {
        console.log('Netflix Auto-Login: Credentials not found in localStorage');
        return;
    }
    
    console.log('Netflix Auto-Login: Credentials found, attempting auto-login...');
    
    function attemptLogin() {
        const emailInput = document.querySelector('input[type="email"], input[name="userLoginId"]');
        const passwordInput = document.querySelector('input[type="password"], input[name="password"]');
        const submitButton = document.querySelector('button[type="submit"], button[data-uia="login-submit-button"]');
        
        if (emailInput && passwordInput) {
            console.log('Netflix Auto-Login: Form found, filling credentials...');
            
            // Fill email
            emailInput.value = email;
            emailInput.dispatchEvent(new Event('input', { bubbles: true }));
            emailInput.dispatchEvent(new Event('change', { bubbles: true }));
            emailInput.dispatchEvent(new Event('blur', { bubbles: true }));
            
            // Fill password
            passwordInput.value = password;
            passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
            passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
            passwordInput.dispatchEvent(new Event('blur', { bubbles: true }));
            
            // Wait a bit then click submit
            setTimeout(() => {
                if (submitButton) {
                    console.log('Netflix Auto-Login: Clicking submit button...');
                    submitButton.click();
                    
                    // Clear credentials after successful login attempt
                    setTimeout(() => {
                        localStorage.removeItem('netflix_auto_email');
                        localStorage.removeItem('netflix_auto_password');
                        console.log('Netflix Auto-Login: Credentials cleared');
                    }, 2000);
                }
            }, 500);
            
            return true;
        }
        return false;
    }
    
    // Try immediately
    if (attemptLogin()) {
        return;
    }
    
    // If form not ready, wait for it using MutationObserver
    const observer = new MutationObserver(() => {
        if (attemptLogin()) {
            observer.disconnect();
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Also try after delays (in case page loads slowly)
    setTimeout(() => {
        attemptLogin();
        observer.disconnect();
    }, 1000);
    
    setTimeout(() => {
        attemptLogin();
        observer.disconnect();
    }, 3000);
    
    setTimeout(() => {
        attemptLogin();
        observer.disconnect();
    }, 5000);
})();
