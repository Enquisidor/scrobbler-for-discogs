import React from 'react';
import { Loader } from './Loader';
import { DiscogsIcon, LastfmIcon, CheckIcon } from './Icons';

interface ConnectionButtonProps {
    service: 'discogs' | 'lastfm';
    isConnected: boolean;
    username: string;
    onConnect: () => void;
    onDisconnect: () => void;
    isLoading: boolean;
    isDisabled: boolean;
}

export default function ConnectionButton({ 
    service, 
    isConnected, 
    username, 
    onConnect, 
    onDisconnect, 
    isLoading,
    isDisabled,
}: ConnectionButtonProps) {
    const buttonClasses = `flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
      isConnected 
      ? 'bg-gray-700 hover:bg-red-500/20 hover:text-red-300 text-gray-300'
      : (service === 'discogs' ? 'bg-brand-discogs hover:bg-black text-white' : 'bg-brand-lastfm hover:bg-red-700 text-white')
    }`;
    const Icon = service === 'discogs' ? DiscogsIcon : LastfmIcon;

    return (
      <button onClick={isConnected ? onDisconnect : onConnect} disabled={isDisabled || isLoading} className={buttonClasses}>
        {isLoading ? <Loader /> : (
          <>
            <Icon className="w-5 h-5" fill="white" />
            {isConnected && <CheckIcon className="w-4 h-4 text-green-400" />}
            <span className="hidden sm:inline">{isConnected ? username : `Connect ${service.charAt(0).toUpperCase() + service.slice(1)}`}</span>
          </>
        )}
      </button>
    );
};