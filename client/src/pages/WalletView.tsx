import React, { useState } from "react";
import { motion } from "framer-motion";
import { useGameState } from "@/hooks/useGameState";
import { useTonConnect } from "@/hooks/useTonConnect";
import { useToast } from "@/hooks/use-toast";

const WalletView: React.FC = () => {
  const { user, connectWallet } = useGameState();
  const { connect, isConnected, address, disconnect } = useTonConnect();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  
  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true);
      await connect();
      setIsConnecting(false);
      
      if (address && user) {
        await connectWallet(address);
        toast({
          title: "Success",
          description: "TON wallet connected successfully!",
        });
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect your TON wallet. Please try again.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };
  
  const handleDisconnectWallet = async () => {
    try {
      await disconnect();
      toast({
        title: "Disconnected",
        description: "Your wallet has been disconnected.",
      });
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  if (!user) return null;
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 py-3"
    >
      <div className="mb-3">
        <h2 className="text-xl font-poppins font-bold">Connect Wallet</h2>
        <p className="text-sm text-gray-400">Connect your TON wallet for rewards</p>
      </div>
      
      <div className="bg-background-card rounded-lg p-4 mb-4 text-center">
        <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M120 240C186.274 240 240 186.274 240 120C240 53.7258 186.274 0 120 0C53.7258 0 0 53.7258 0 120C0 186.274 53.7258 240 120 240ZM85.3149 98.0261C94.3552 98.0261 100.806 90.385 100.806 74.7241C100.806 58.7466 93.7986 51.2876 77.7782 51.2876H56.4375V147.238H77.2217C94.1699 147.238 101.733 139.227 101.733 122.635C101.733 105.667 94.541 98.0261 85.3149 98.0261ZM76.8505 63.2389C84.3889 63.2389 87.7298 67.5799 87.7298 74.9094C87.7298 82.075 84.9454 86.2308 77.0364 86.2308H69.4979V63.2389H76.8505ZM77.7782 135.442H69.4979V97.8408H77.963C86.2476 97.8408 89.0298 102.367 89.0298 110.277C89.0298 118.294 85.3149 135.442 77.7782 135.442ZM183.396 121.152L198.977 86.7867H185.249L171.893 117.36H168.181L154.826 86.7867H141.097L156.493 121.523L138.87 147.052H152.229L168.366 116.993H168.736L185.064 147.052H199L183.396 121.152Z" fill="#0098EA"/>
          </svg>
        </div>
        
        <h3 className="text-lg font-bold mb-2">Connect TON Wallet</h3>
        <p className="text-sm text-gray-400 mb-4">
          {isConnected 
            ? "Your wallet is connected! You are now eligible for future airdrops and rewards."
            : "Connect your wallet to be eligible for future airdrops and rewards"
          }
        </p>
        
        {isConnected ? (
          <>
            <div className="bg-background-light rounded-lg p-2 mb-3 break-all">
              <span className="text-xs text-gray-300">{address}</span>
            </div>
            <button 
              className="bg-error text-white rounded-lg px-4 py-3 font-bold w-full mb-3"
              onClick={handleDisconnectWallet}
            >
              Disconnect Wallet
            </button>
          </>
        ) : (
          <button 
            className="bg-primary text-white rounded-lg px-4 py-3 font-bold w-full mb-3"
            onClick={handleConnectWallet}
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
        
        <div className="text-xs text-gray-500">
          We never store your private keys
        </div>
      </div>
      
      <div className="bg-background-card rounded-lg p-3 mb-4">
        <h3 className="text-lg font-bold mb-2">Coming Soon</h3>
        
        <div className="space-y-3">
          <div className="p-3 bg-background-light rounded-lg opacity-70">
            <div className="flex items-center mb-2">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="font-bold">NFT Planets</div>
            </div>
            <p className="text-xs text-gray-400">Collect unique planet NFTs with special abilities</p>
          </div>
          
          <div className="p-3 bg-background-light rounded-lg opacity-70">
            <div className="flex items-center mb-2">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-10a1 1 0 01.707.293l.707.707L15.414 5a1 1 0 11-1.414 1.414L13 5.414 12.707 5.7a1 1 0 11-1.414-1.414l.707-.707A1 1 0 0112 2zm0 10a1 1 0 01.707.293l.707.707L15.414 15a1 1 0 11-1.414 1.414L13 15.414l-.293.293a1 1 0 01-1.414-1.414l.707-.707A1 1 0 0112 12z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="font-bold">Token Rewards</div>
            </div>
            <p className="text-xs text-gray-400">Earn tokens for your in-game achievements</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WalletView;
