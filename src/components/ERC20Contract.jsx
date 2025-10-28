import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import contractABI from '../abi/abi.json'
import { ERC20_CONTRACT_ADDRESS } from '../constants/contracts'
import './ERC20Contract.css'

// Polyfill for WalletConnect compatibility
if (typeof window !== 'undefined') {
  window.global = window.global || window
  if (!window.process) {
    window.process = { env: {}, version: '', platform: 'browser', browser: true }
  }
}

const ERC20Contract = () => {
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [account, setAccount] = useState(null)
  const [connected, setConnected] = useState(false)
  const [contractAddress, setContractAddress] = useState(ERC20_CONTRACT_ADDRESS)
  const [contract, setContract] = useState(null)
  const [tokenInfo, setTokenInfo] = useState({})
  const [callableFunctions, setCallableFunctions] = useState([])
  const [functionInputs, setFunctionInputs] = useState({})
  const [transactionResults, setTransactionResults] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [connectionMethod, setConnectionMethod] = useState('metamask') // 'metamask' or 'walletconnect'
  const [currentNetwork, setCurrentNetwork] = useState(null)

  // BSC Testnet Configuration
  const BSC_TESTNET = {
    chainId: '0x61', // 97 in hex
    chainName: 'Binance Smart Chain Testnet',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
    blockExplorerUrls: ['https://testnet.bscscan.com']
  }

  // Parse ABI to get all callable functions
  useEffect(() => {
    const functions = contractABI.filter(item => item.type === 'function')
    const callableFns = functions.map(fn => ({
      name: fn.name,
      inputs: fn.inputs || [],
      outputs: fn.outputs || [],
      stateMutability: fn.stateMutability,
      isWrite: fn.stateMutability === 'nonpayable' || fn.stateMutability === 'payable',
      isRead: fn.stateMutability === 'view' || fn.stateMutability === 'pure'
    }))
    
    setCallableFunctions(callableFns)
    
    // Initialize input state for each function
    const inputsState = {}
    callableFns.forEach(fn => {
      inputsState[fn.name] = fn.inputs.map(() => '')
    })
    setFunctionInputs(inputsState)
  }, [])

  // Create Unity-compatible bridge methods
  useEffect(() => {
    // Create Unity bridge object
    window.UnityERC20Bridge = {
      // Connection methods
      connectWallet: (method) => {
        if (method === 'metamask') {
          connectMetaMask()
        } else {
          connectWalletConnect()
        }
      },
      
      disconnect: () => {
        disconnectWallet()
      },
      
      loadContract: (address) => {
        setContractAddress(address)
        setTimeout(() => loadContract(), 100)
      },
      
      // Token info methods (return promises that Unity can await)
      getBalance: () => {
        if (!contract || !account) return Promise.resolve('0')
        return contract.balanceOf(account).then(balance => {
          return ethers.formatUnits(balance, tokenInfo.decimals || 18)
        })
      },
      
      getName: () => {
        if (!contract) return Promise.resolve('')
        return contract.name()
      },
      
      getSymbol: () => {
        if (!contract) return Promise.resolve('')
        return contract.symbol()
      },
      
      getDecimals: () => {
        if (!contract) return Promise.resolve('18')
        return contract.decimals().then(d => d.toString())
      },
      
      getTotalSupply: () => {
        if (!contract) return Promise.resolve('0')
        return contract.totalSupply().then(supply => {
          return ethers.formatUnits(supply, tokenInfo.decimals || 18)
        })
      },
      
      // Token action methods
      transfer: (to, amount) => {
        if (!contract) return Promise.reject('No contract loaded')
        const decimals = tokenInfo.decimals || 18
        const amountParsed = ethers.parseUnits(amount, decimals)
        return contract.transfer(to, amountParsed)
      },
      
      approve: (spender, amount) => {
        if (!contract) return Promise.reject('No contract loaded')
        const decimals = tokenInfo.decimals || 18
        const amountParsed = ethers.parseUnits(amount, decimals)
        return contract.approve(spender, amountParsed)
      },
      
      transferFrom: (from, to, amount) => {
        if (!contract) return Promise.reject('No contract loaded')
        const decimals = tokenInfo.decimals || 18
        const amountParsed = ethers.parseUnits(amount, decimals)
        return contract.transferFrom(from, to, amountParsed)
      },
      
      allowance: (owner, spender) => {
        if (!contract) return Promise.resolve('0')
        return contract.allowance(owner, spender).then(allowance => {
          return ethers.formatUnits(allowance, tokenInfo.decimals || 18)
        })
      },
      
      // Get connection status
      isConnected: () => connected,
      
      // Get current account
      getAccount: () => account || '',
      
      // Get contract address
      getContractAddress: () => contractAddress
    }
    
    return () => {
      if (window.UnityERC20Bridge) {
        delete window.UnityERC20Bridge
      }
    }
  }, [contract, connected, account, contractAddress, tokenInfo.decimals])

  // Switch to BSC Testnet
  const switchToBSCTestnet = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x61' }]
      })
      setSuccess('Switched to BSC Testnet')
    } catch (switchError) {
      // Chain not added, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [BSC_TESTNET]
          })
          setSuccess('BSC Testnet added and switched')
        } catch (addError) {
          setError('Failed to add BSC Testnet: ' + addError.message)
          throw addError
        }
      } else {
        throw switchError
      }
    }
  }

  // Connect wallet using MetaMask
  const connectMetaMask = async () => {
    try {
      setError('')
      if (window.ethereum) {
        setConnectionMethod('metamask')
        
        // Check current network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        console.log('Current chain:', chainId)
        
        // Switch to BSC Testnet if not already
        if (chainId !== '0x61') {
          setSuccess('Switching to BSC Testnet...')
          await switchToBSCTestnet()
        } else {
          setCurrentNetwork('BSC Testnet')
        }
        
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        const web3Provider = new ethers.BrowserProvider(window.ethereum)
        const web3Signer = await web3Provider.getSigner()
        
        setProvider(web3Provider)
        setSigner(web3Signer)
        setAccount(accounts[0])
        setConnected(true)
        setCurrentNetwork('BSC Testnet')
        
        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts) => {
          if (accounts.length > 0) {
            setAccount(accounts[0])
            loadContract()
          } else {
            setConnected(false)
            setAccount(null)
            setSigner(null)
            setProvider(null)
          }
        })
        
        // Listen for chain changes
        window.ethereum.on('chainChanged', (chainId) => {
          window.location.reload()
        })
        
        setSuccess('MetaMask connected to BSC Testnet!')
      } else {
        setError('MetaMask is not installed. Please install MetaMask extension.')
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
      setError('Failed to connect wallet: ' + error.message)
    }
  }

  // Connect wallet using WalletConnect
  const connectWalletConnect = async () => {
    try {
      setError('')
      setConnectionMethod('walletconnect')
      
      // Check if WalletConnect is available
      setLoading(true)
      setSuccess('Initializing WalletConnect...')
      
      // Make global available for WalletConnect
      if (typeof window !== 'undefined' && !window.global) {
        window.global = window
      }
      
      // Try to import WalletConnect
      let EthereumProvider
      try {
        const wc = await import('@walletconnect/ethereum-provider')
        EthereumProvider = wc.EthereumProvider
      } catch (importError) {
        throw new Error('WalletConnect package not properly installed. Please use MetaMask for now.')
      }
      
      const provider = await EthereumProvider.init({
        projectId: '2f9a1c4f8f3a3e8e4c9d6b7a5f8c2e3d', // Demo project ID
        chains: [97], // BSC Testnet
        optionalChains: [56, 1], // BSC Mainnet, Ethereum
        showQrModal: true,
        metadata: {
          name: 'Media Converter',
          description: 'ERC20 Token Manager',
          url: window.location.origin,
          icons: [`${window.location.origin}/favicon.ico`]
        }
      })
      
      setSuccess('Connecting to wallet...')
      await provider.enable()
      
      const ethersProvider = new ethers.BrowserProvider(provider)
      const signer = await ethersProvider.getSigner()
      const accounts = await ethersProvider.listAccounts()
      
        setProvider(ethersProvider)
        setSigner(signer)
        setAccount(accounts[0].address)
        setConnected(true)
        setCurrentNetwork('BSC Testnet')
        
        setSuccess('WalletConnect connected to BSC Testnet!')
      
      // Listen for disconnect
      provider.on('disconnect', () => {
        setConnected(false)
        setAccount(null)
        setSigner(null)
        setProvider(null)
      })
      
    } catch (error) {
      console.error('Error connecting WalletConnect:', error)
      setError('WalletConnect error: ' + (error.message || error.toString()) + '. Please use MetaMask instead.')
      setSuccess('')
    } finally {
      setLoading(false)
    }
  }

  const connectWallet = async () => {
    if (connectionMethod === 'metamask') {
      await connectMetaMask()
    } else {
      await connectWalletConnect()
    }
  }

  // Disconnect wallet
  const disconnectWallet = () => {
    setConnected(false)
    setAccount(null)
    setSigner(null)
    setProvider(null)
    setContract(null)
    setTokenInfo({})
    setTransactionResults({})
  }

  // Load contract with provided address
  const loadContract = async () => {
    try {
      setError('')
      if (!signer || !contractAddress) {
        setError('Please provide contract address')
        return
      }

      if (!ethers.isAddress(contractAddress)) {
        setError('Invalid contract address')
        return
      }

      const erc20Contract = new ethers.Contract(contractAddress, contractABI, signer)
      setContract(erc20Contract)

          // Load token info - only try basic operations
      try {
        const tokenInfoData = {}
        let decimals = 18
        
        // Only attempt to get balance if account is connected
        if (account) {
          try {
            const balance = await erc20Contract.balanceOf(account)
            tokenInfoData.balance = ethers.formatUnits(balance, decimals)
          } catch (err) {
            console.log('Could not load balance')
            tokenInfoData.balance = '0'
          }
        }
        
        setTokenInfo(tokenInfoData)
        setSuccess('Contract loaded! Note: ABI may not match all functions.')
        setError('Warning: The ABI may not fully match this contract. Basic functions like balanceOf should work.')
        
      } catch (err) {
        console.error('Error loading contract:', err)
        setError('Contract loaded. Please verify the ABI matches the deployed contract.')
        setSuccess('')
      }
    } catch (error) {
      console.error('Error loading contract:', error)
      setError('Failed to load contract: ' + error.message)
    }
  }

  // Call a read function
  const callReadFunction = async (functionName, inputs, outputs) => {
    try {
      setLoading(true)
      setError('')
      
      if (!contract) return

      // Check if all required inputs are provided
      const requiredInputs = inputs.filter((input, idx) => {
        const value = functionInputs[functionName]?.[idx]
        return !value || value.trim() === ''
      })
      
      if (requiredInputs.length > 0 && requiredInputs.length === inputs.length) {
        const inputNames = inputs.map((inp, idx) => inp.name || `param${idx}`).join(', ')
        setError(`Please provide all required parameters: ${inputNames}`)
        setLoading(false)
        return
      }

      // Parse inputs
      const parsedInputs = inputs.map((input, idx) => {
        const value = functionInputs[functionName][idx]
        if (!value || value.trim() === '') {
          return undefined
        }
        
        if (input.type === 'address') {
          if (!ethers.isAddress(value)) {
            throw new Error(`Invalid ${input.name} address`)
          }
          return value
        } else if (input.type.includes('uint')) {
          return BigInt(value)
        } else if (input.type.includes('int')) {
          return BigInt(value)
        }
        return value
      }).filter(inp => inp !== undefined)

      console.log(`Calling ${functionName} with params:`, parsedInputs)
      
      const result = await contract[functionName](...parsedInputs)
      
      // Format output based on type
      let formattedResult = result
      if (outputs.length > 1) {
        formattedResult = outputs.map((output, idx) => {
          const val = result[idx]
          if (output.type.includes('uint') || output.type.includes('int')) {
            return formatValue(val, output.type)
          }
          return val
        })
      } else if (outputs.length === 1) {
        const output = outputs[0]
        if (output.type.includes('uint') || output.type.includes('int')) {
          formattedResult = formatValue(result, output.type)
        }
      }

      setTransactionResults(prev => ({
        ...prev,
        [functionName]: formattedResult
      }))
      setSuccess(`Function ${functionName} executed successfully!`)
      
    } catch (error) {
      console.error('Error calling function:', error)
      setError(`Error calling ${functionName}: ${error.message || error.toString()}`)
      setSuccess('')
    } finally {
      setLoading(false)
    }
  }

  // Call a write function
  const callWriteFunction = async (functionName, inputs, outputs) => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')
      
      if (!contract) return

      // Parse inputs
      const parsedInputs = inputs.map((input, idx) => {
        const value = functionInputs[functionName][idx]
        if (input.type === 'address') {
          if (!value || !ethers.isAddress(value)) {
            throw new Error(`Invalid ${input.name} address`)
          }
          return value
        } else if (input.type.includes('uint')) {
          if (functionName === 'transfer' || functionName === 'approve' || functionName === 'transferFrom') {
            // For transfer, assume token decimals
            return ethers.parseUnits(value, tokenInfo.decimals || 18)
          }
          return BigInt(value)
        } else if (input.type.includes('int')) {
          return BigInt(value)
        }
        return value
      })

      setSuccess(`Sending ${functionName} transaction...`)
      const tx = await contract[functionName](...parsedInputs)
      
      setSuccess(`Transaction sent! Hash: ${tx.hash} - Waiting for confirmation...`)
      const receipt = await tx.wait()
      
      setSuccess(`Transaction confirmed! Hash: ${receipt.hash}`)
      
      // Refresh token info if balance changed
      if (['transfer', 'approve'].includes(functionName) && account) {
        loadContract()
      }
      
    } catch (error) {
      console.error('Error calling function:', error)
      setError(`Error: ${error.message}`)
      setSuccess('')
    } finally {
      setLoading(false)
    }
  }

  // Format value based on type
  const formatValue = (value, type) => {
    if (type.includes('uint') || type.includes('int')) {
      if (type === 'uint256' && tokenInfo.decimals) {
        // Try to format as token amount
        try {
          return ethers.formatUnits(value, tokenInfo.decimals)
        } catch {
          return value.toString()
        }
      }
      return value.toString()
    }
    return value
  }

  // Update function input
  const updateFunctionInput = (functionName, inputIndex, value) => {
    setFunctionInputs(prev => ({
      ...prev,
      [functionName]: prev[functionName].map((val, idx) => 
        idx === inputIndex ? value : val
      )
    }))
  }

  // Render function input
  const renderFunctionInput = (fnName, input, inputIndex) => {
    return (
      <div key={inputIndex} className="function-input">
        <label>{input.name || `param${inputIndex}`} ({input.type}):</label>
        <input
          type="text"
          value={functionInputs[fnName]?.[inputIndex] || ''}
          onChange={(e) => updateFunctionInput(fnName, inputIndex, e.target.value)}
          placeholder={`Enter ${input.type}`}
          className="function-param-input"
        />
      </div>
    )
  }

  // Get label for function
  const getFunctionLabel = (fn) => {
    const labels = {
      'balanceOf': 'Get Balance',
      'transfer': 'Transfer Tokens',
      'approve': 'Approve Tokens',
      'transferFrom': 'Transfer From',
      'allowance': 'Get Allowance',
      'name': 'Get Name',
      'symbol': 'Get Symbol',
      'decimals': 'Get Decimals',
      'totalSupply': 'Get Total Supply',
      'owner': 'Get Owner'
    }
    return labels[fn.name] || fn.name
  }

  // Get icon for function
  const getFunctionIcon = (fn) => {
    if (fn.isWrite) return '✏️'
    return '👁️'
  }

  return (
    <div className="contract-container">
      <h2 className="contract-title">🔗 ERC20 Contract Interface</h2>
      
      {/* Unity Integration Info */}
      <div className="unity-info">
        <p><strong>Unity Game Integration:</strong></p>
        <p className="unity-code">
          Use <code>window.UnityERC20Bridge</code> object in Unity:
        </p>
        <div className="unity-examples">
          <code>window.UnityERC20Bridge.connectWallet('metamask')</code>
          <code>window.UnityERC20Bridge.getBalance().then(balance ={'>'} console.log(balance))</code>
          <code>window.UnityERC20Bridge.transfer(to, amount)</code>
        </div>
        <div className="note-box">
          <strong>Note:</strong> MetaMask is recommended for best compatibility with Unity WebGL
        </div>
      </div>

      {/* Network Info */}
      <div className="network-info">
        <p><strong>🌐 Network:</strong> BSC Testnet (Chain ID: 97)</p>
        {currentNetwork && <p className="network-status">Currently connected to: {currentNetwork}</p>}
      </div>

      {/* ABI Warning */}
      <div className="abi-warning">
        <p><strong>⚠️ Important:</strong> The ABI in <code>abi.json</code> may not match contract <code>{ERC20_CONTRACT_ADDRESS}</code></p>
        <p className="warning-subtitle">
          <strong>Solution:</strong> Get the correct ABI from{' '}
          <a href={`https://testnet.bscscan.com/address/${ERC20_CONTRACT_ADDRESS}#code`} target="_blank" rel="noopener noreferrer">
            BSCScan
          </a>
          {' '}or provide the correct ABI file.
        </p>
        <p className="warning-subtitle">All function buttons are marked "Try" - they may not work with this contract.</p>
      </div>

      {/* Wallet Connection */}
      <div className="wallet-section">
        <div className="connection-methods">
          <button 
            onClick={connectMetaMask} 
            className={`connection-btn ${connectionMethod === 'metamask' && connected ? 'active' : ''}`}
            disabled={connected && connectionMethod === 'walletconnect'}
          >
            🦊 MetaMask (Recommended)
          </button>
          <button 
            onClick={connectWalletConnect} 
            className={`connection-btn ${connectionMethod === 'walletconnect' && connected ? 'active' : ''}`}
            disabled={connected && connectionMethod === 'metamask'}
          >
            🔗 WalletConnect
          </button>
        </div>
        
          {connected && (
            <div className="wallet-info">
              <p className="account-info">Connected: {account?.substring(0, 6)}...{account?.substring(38)}</p>
              <p className="method-info">Method: {connectionMethod} | Network: {currentNetwork || 'Unknown'}</p>
              <button onClick={disconnectWallet} className="disconnect-button">
                Disconnect
              </button>
            </div>
          )}
      </div>

      {connected && (
        <>
          {/* Contract Setup */}
          <div className="contract-setup">
            <h3>Contract Configuration</h3>
            <div className="input-group">
              <label>Contract Address (Pre-configured):</label>
              <input
                type="text"
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                placeholder="0x..."
                className="address-input"
              />
              <p className="contract-info-text">Configured: {ERC20_CONTRACT_ADDRESS}</p>
            </div>
            <button onClick={loadContract} className="load-button">
              Load Contract
            </button>
            <p className="info-note">✓ Using ABI from abi.json file</p>
          </div>

          {/* Token Info */}
          {contract && Object.keys(tokenInfo).length > 0 && (
            <div className="contract-info">
              <h3>Token Information</h3>
              <div className="info-grid">
                {tokenInfo.name && (
                  <div className="info-item">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{tokenInfo.name}</span>
                  </div>
                )}
                {tokenInfo.symbol && (
                  <div className="info-item">
                    <span className="info-label">Symbol:</span>
                    <span className="info-value">{tokenInfo.symbol}</span>
                  </div>
                )}
                {tokenInfo.balance && (
                  <div className="info-item">
                    <span className="info-label">Your Balance:</span>
                    <span className="info-value">{tokenInfo.balance} {tokenInfo.symbol}</span>
                  </div>
                )}
                {tokenInfo.decimals && (
                  <div className="info-item">
                    <span className="info-label">Decimals:</span>
                    <span className="info-value">{tokenInfo.decimals}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Function Buttons */}
          {contract && callableFunctions.length > 0 && (
            <div className="contract-functions">
              <h3>Contract Functions</h3>
              
              {/* Write Functions */}
              <div className="functions-group">
                <h4 className="functions-group-title">📝 Write Functions (Try these common ones)</h4>
                <div className="functions-grid">
                  {callableFunctions.filter(fn => fn.isWrite).map(fn => (
                    <div key={fn.name} className="function-card">
                      <div className="function-header">
                        <span className="function-icon">{getFunctionIcon(fn)}</span>
                        <h5 className="function-name">{getFunctionLabel(fn)}</h5>
                      </div>
                      
                      {fn.inputs.length > 0 && (
                        <div className="function-params">
                          {fn.inputs.map((input, idx) => renderFunctionInput(fn.name, input, idx))}
                        </div>
                      )}
                      
                      <button
                        onClick={() => callWriteFunction(fn.name, fn.inputs, fn.outputs)}
                        disabled={loading}
                        className="function-button"
                      >
                        {loading ? '⏳ Processing...' : `Try ${fn.name}`}
                      </button>
                      
                      <p className="function-note">If this fails, the function may not exist on this contract.</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Read Functions */}
              <div className="functions-group">
                <h4 className="functions-group-title">👁️ Read Functions (Try these)</h4>
                <div className="functions-grid">
                  {callableFunctions.filter(fn => fn.isRead).map(fn => (
                    <div key={fn.name} className="function-card">
                      <div className="function-header">
                        <span className="function-icon">{getFunctionIcon(fn)}</span>
                        <h5 className="function-name">{getFunctionLabel(fn)}</h5>
                      </div>
                      
                      {fn.inputs.length > 0 && (
                        <div className="function-params">
                          {fn.inputs.map((input, idx) => renderFunctionInput(fn.name, input, idx))}
                        </div>
                      )}
                      
                      <button
                        onClick={() => callReadFunction(fn.name, fn.inputs, fn.outputs)}
                        disabled={loading}
                        className="function-button read"
                      >
                        {loading ? '⏳ Processing...' : `Try ${fn.name}`}
                      </button>
                      
                      {transactionResults[fn.name] && (
                        <div className="function-result">
                          <strong>Result:</strong> {JSON.stringify(transactionResults[fn.name])}
                        </div>
                      )}
                      
                      {transactionResults[fn.name] === undefined && !loading && (
                        <p className="function-note">Click to test if this function exists.</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {error && (
            <div className="message error">
              <strong>Error:</strong> {error}
            </div>
          )}
          {success && (
            <div className="message success">
              <strong>Success:</strong> {success}
            </div>
          )}
          {loading && (
            <div className="message loading">
              ⏳ Processing transaction...
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ERC20Contract
