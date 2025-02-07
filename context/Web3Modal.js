'use client'

import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react'

// 1. Get projectId from https://cloud.walletconnect.com
const projectId = 'YOUR_PROJECT_ID'

// 2. Set chains - Using Holesky Testnet
const holesky = {
  chainId: 17000,
  name: 'Holesky',
  currency: 'ETH',
  explorerUrl: 'https://holesky.etherscan.io',
  rpcUrl: 'https://ethereum-holesky.publicnode.com'
}

// 3. Create a metadata object
const metadata = {
  name: 'AI AVS',
  description: 'AI AVS Web3 Application',
  url: 'http://localhost:3000',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// 4. Create Ethers config
const ethersConfig = defaultConfig({
  /*Required*/
  metadata,

  /*Optional*/
  enableEIP6963: true,
  enableInjected: true,
  enableCoinbase: false, // Disable other wallets
  enableWalletConnect: false, // Disable WalletConnect
  rpcUrl: 'https://ethereum-holesky.publicnode.com',
  defaultChainId: 17000
})

// 5. Create a Web3Modal instance
createWeb3Modal({
  ethersConfig,
  chains: [holesky],
  projectId,
  defaultChain: holesky,
  enableAnalytics: true
})

function Web3ModalProvider({ children }) {
  return children
}

export default Web3ModalProvider