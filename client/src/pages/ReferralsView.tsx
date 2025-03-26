import React, { useState } from "react";
import { motion } from "framer-motion";
import { useGameState } from "@/hooks/useGameState";
import { formatNumber } from "@/utils/formatters";
import { CopyIcon, ShareIcon } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { useTelegram } from "@/hooks/useTelegram";

const ReferralsView: React.FC = () => {
  const { user } = useGameState();
  const { toast } = useToast();
  const { telegramWebApp } = useTelegram();
  
  const [copiedLink, setCopiedLink] = useState(false);
  
  const referralLink = user ? `t.me/PlanetTycoonBot?start=${user.referralCode}` : '';
  
  const handleCopyReferralLink = () => {
    if (!referralLink) return;
    
    navigator.clipboard.writeText(referralLink)
      .then(() => {
        setCopiedLink(true);
        toast({
          title: "Link Copied",
          description: "Referral link copied to clipboard!",
        });
        
        setTimeout(() => setCopiedLink(false), 2000);
      })
      .catch(() => {
        toast({
          title: "Copy Failed",
          description: "Failed to copy referral link.",
          variant: "destructive",
        });
      });
  };
  
  const handleShareReferral = (platform: string) => {
    if (!referralLink || !telegramWebApp) return;
    
    // Use Telegram's native sharing for all platforms
    telegramWebApp.showPopup({
      title: "Share your referral link",
      message: `Share this link with friends to earn bonus points: ${referralLink}`,
      buttons: [
        { type: "default", text: "Share" },
        { type: "cancel", text: "Cancel" }
      ]
    }, (buttonId) => {
      if (buttonId === "0") {
        // User pressed Share
        if (platform === "telegram") {
          telegramWebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("Join me on Planet Tycoon and we both get bonus points!")}`);
        } else {
          // For other platforms, just use the general share option
          telegramWebApp.openLink(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("Join me on Planet Tycoon and we both get bonus points!")}`);
        }
      }
    });
  };
  
  // Sample referrals for demo (will be replaced with actual referrals from API)
  const referrals = user?.referralCount ? Array.from({ length: Math.min(user.referralCount, 2) }).map((_, i) => ({
    id: i + 1,
    name: `Friend ${i + 1}`,
    joinedDays: Math.floor(Math.random() * 10) + 1,
    points: 250
  })) : [];
  
  if (!user) return null;
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 py-3"
    >
      <div className="mb-3">
        <h2 className="text-xl font-poppins font-bold">Referrals</h2>
        <p className="text-sm text-gray-400">Invite friends to earn bonus points</p>
      </div>
      
      <div className="bg-background-card rounded-lg p-4 mb-4 text-center">
        <div className="mb-3">
          <div className="text-lg font-bold">Your Referral Link</div>
          <div className="bg-background-light rounded-lg p-2 mt-2 text-sm text-gray-300 break-all">
            {referralLink}
          </div>
        </div>
        
        <button 
          className="bg-primary text-white rounded-lg px-4 py-2 font-bold w-full flex items-center justify-center"
          onClick={handleCopyReferralLink}
        >
          <CopyIcon className="w-4 h-4 mr-2" />
          {copiedLink ? "Copied!" : "Copy Link"}
        </button>
        
        <div className="my-4 flex items-center justify-center space-x-3">
          <button 
            className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center"
            onClick={() => handleShareReferral("telegram")}
          >
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.05-.2-.06-.06-.17-.04-.25-.02-.11.02-1.84 1.17-5.21 3.42-.49.33-.94.5-1.35.48-.44-.02-1.29-.25-1.92-.46-.78-.26-1.39-.4-1.34-.85.03-.22.27-.45.74-.68 2.87-1.25 4.79-2.08 5.76-2.49 2.73-1.15 3.29-1.35 3.66-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.08-.01.18-.02.27z"></path>
            </svg>
          </button>
          <button 
            className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center"
            onClick={() => handleShareReferral("whatsapp")}
          >
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.18 2.095 3.195 5.076 4.483.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.196-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"></path>
            </svg>
          </button>
          <button 
            className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center"
            onClick={() => handleShareReferral("instagram")}
          >
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="bg-background-card rounded-lg p-3 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold">Your Referrals</h3>
          <div className="text-sm">
            <span className="text-accent font-bold">{user.referralCount}</span> friends
          </div>
        </div>
        
        <div className="space-y-3">
          {referrals.length > 0 ? (
            referrals.map(referral => (
              <div key={referral.id} className="flex justify-between items-center p-2 bg-background-light rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mr-3 text-white font-bold">
                    {referral.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold">{referral.name}</div>
                    <div className="text-xs text-gray-400">Joined {referral.joinedDays} days ago</div>
                  </div>
                </div>
                <div className="text-sm font-bold text-accent">+{referral.points}</div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-3">
              <ShareIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No referrals yet</p>
              <p className="text-xs mt-1">Share your link to start earning bonus points!</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-background-card rounded-lg p-3">
        <h3 className="text-lg font-bold mb-2">Rewards</h3>
        <div className="text-sm text-gray-300">
          <p className="mb-1">• <span className="text-accent font-bold">250 points</span> for each friend who joins</p>
          <p className="mb-1">• <span className="text-accent font-bold">+10% bonus</span> on all your friend's earnings</p>
          <p>• Special rewards when you reach <span className="text-accent font-bold">10</span>, <span className="text-accent font-bold">50</span> and <span className="text-accent font-bold">100</span> referrals</p>
        </div>
      </div>
    </motion.div>
  );
};

export default ReferralsView;
