# Unity Game Integration Guide

## Overview
This ERC20 Contract interface is designed to work with Unity WebGL builds. All functions are accessible via the `window.UnityERC20Bridge` object.

## Available Methods

### Connection Methods

#### Connect Wallet
```javascript
// Connect with MetaMask
window.UnityERC20Bridge.connectWallet('metamask')

// Connect with WalletConnect
window.UnityERC20Bridge.connectWallet('walletconnect')
```

#### Disconnect
```javascript
window.UnityERC20Bridge.disconnect()
```

#### Check Connection Status
```javascript
const isConnected = window.UnityERC20Bridge.isConnected()
const account = window.UnityERC20Bridge.getAccount()
```

### Load Contract
```javascript
// Contract address is pre-configured (0xeCE9C1269C9Aa734F133999D6E21279299cf5DE3)
// You can load it by calling:
window.UnityERC20Bridge.loadContract('0xeCE9C1269C9Aa734F133999D6E21279299cf5DE3')
```

### Read Functions (View/Pure)

#### Get Token Balance
```javascript
window.UnityERC20Bridge.getBalance()
  .then(balance => console.log('Balance:', balance))
  .catch(err => console.error(err))
```

#### Get Token Name
```javascript
window.UnityERC20Bridge.getName()
  .then(name => console.log('Token:', name))
```

#### Get Token Symbol
```javascript
window.UnityERC20Bridge.getSymbol()
  .then(symbol => console.log('Symbol:', symbol))
```

#### Get Decimals
```javascript
window.UnityERC20Bridge.getDecimals()
  .then(decimals => console.log('Decimals:', decimals))
```

#### Get Total Supply
```javascript
window.UnityERC20Bridge.getTotalSupply()
  .then(supply => console.log('Total Supply:', supply))
```

#### Get Allowance
```javascript
window.UnityERC20Bridge.allowance(ownerAddress, spenderAddress)
  .then(allowance => console.log('Allowance:', allowance))
```

### Write Functions (nonpayable)

#### Transfer Tokens
```javascript
window.UnityERC20Bridge.transfer(toAddress, amount)
  .then(tx => {
    console.log('Transaction:', tx.hash)
    return tx.wait()
  })
  .then(receipt => {
    console.log('Confirmed:', receipt)
  })
```

#### Approve Tokens
```javascript
window.UnityERC20Bridge.approve(spenderAddress, amount)
  .then(tx => tx.wait())
  .then(receipt => console.log('Approved'))
```

#### Transfer From
```javascript
window.UnityERC20Bridge.transferFrom(fromAddress, toAddress, amount)
  .then(tx => tx.wait())
  .then(receipt => console.log('Transferred'))
```

## Unity C# Integration Example

### JavaScript Interface (jslib)
Create a file in your Unity project: `Assets/Plugins/ERC20Bridge.jslib`

```javascript
mergeInto(LibraryManager.library, {
  ConnectWallet: function(method) {
    var methodStr = UTF8ToString(method);
    if (typeof window.UnityERC20Bridge !== 'undefined') {
      window.UnityERC20Bridge.connectWallet(methodStr);
    }
  },
  
  GetBalance: function(callback) {
    if (typeof window.UnityERC20Bridge !== 'undefined') {
      window.UnityERC20Bridge.getBalance()
        .then(balance => {
          var result = UTF8ToString(balance);
          Runtime.dynCall('v', callback, [result]);
        });
    }
  },
  
  Transfer: function(to, amount, callback) {
    var toStr = UTF8ToString(to);
    var amountStr = UTF8ToString(amount);
    if (typeof window.UnityERC20Bridge !== 'undefined') {
      window.UnityERC20Bridge.transfer(toStr, amountStr)
        .then(tx => {
          Runtime.dynCall('v', callback);
        });
    }
  }
});
```

### C# Script
```csharp
using UnityEngine;
using System.Runtime.InteropServices;

public class ERC20Bridge : MonoBehaviour
{
    [DllImport("__Internal")]
    private static extern void ConnectWallet(string method);
    
    [DllImport("__Internal")]
    private static extern void GetBalance();
    
    [DllImport("__Internal")]
    private static extern void Transfer(string to, string amount);
    
    // Start is called before the first frame update
    void Start()
    {
        // Connect wallet
        ConnectWallet("metamask");
    }
    
    // Callback from JavaScript
    [MonoPInvokeCallback(typeof(Action<string>))]
    public static void OnBalanceReceived(string balance)
    {
        Debug.Log($"Balance: {balance}");
    }
    
    // Transfer tokens
    public void SendTokens(string recipient, string amount)
    {
        Transfer(recipient, amount);
    }
}
```

## Example Usage in Unity

```csharp
using UnityEngine;
using UnityEngine.UI;
using System;

public class TokenManager : MonoBehaviour
{
    [Header("UI References")]
    public Button connectButton;
    public Button transferButton;
    public InputField addressInput;
    public InputField amountInput;
    public Text balanceText;
    
    private bool isConnected = false;
    
    void Start()
    {
        connectButton.onClick.AddListener(OnConnectClicked);
        transferButton.onClick.AddListener(OnTransferClicked);
    }
    
    public void OnConnectClicked()
    {
        // Connect MetaMask
        ConnectWallet("metamask");
    }
    
    public void OnTransferClicked()
    {
        if (!isConnected) return;
        
        string to = addressInput.text;
        string amount = amountInput.text;
        
        TransferTokens(to, amount);
    }
    
    // These methods should be exposed to JavaScript
    public void TransferTokens(string to, string amount)
    {
        if (Application.platform == RuntimePlatform.WebGLPlayer)
        {
            TransferFromJS(to, amount);
        }
    }
    
    private void TransferFromJS(string to, string amount)
    {
        #if UNITY_WEBGL && !UNITY_EDITOR
        Transfer(to, amount);
        #endif
    }
}
```

## Notes

1. **Contract Address**: Pre-configured to `0xeCE9C1269C9Aa734F133999D6E21279299cf5DE3`
2. **Network**: Currently configured for Ethereum mainnet (chain ID 1)
3. **WebGL Only**: These methods only work in WebGL builds, not in the Unity Editor
4. **MetaMask Recommended**: Best compatibility with Unity WebGL

## Troubleshooting

### WalletConnect Error
If you see a Project ID error, get a free ID from [WalletConnect Cloud](https://cloud.walletconnect.com) and update the code:
```javascript
projectId: 'YOUR_WALLETCONNECT_PROJECT_ID'
```

### Connection Issues
- Make sure MetaMask is installed and unlocked
- Check that the network is correct (Ethereum mainnet)
- Verify contract address is correct

### Unity Build Settings
1. Set platform to WebGL
2. Go to Player Settings
3. Enable "Internet Access"
4. Build and deploy to hosting service

