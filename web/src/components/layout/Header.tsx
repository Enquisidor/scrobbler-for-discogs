import React from 'react';
import type { Credentials } from '@libs';
import ConnectionButton from '../misc/ConnectionButton';
import { Loader } from '../misc/Loader';
import { SettingsIcon, RefreshIcon } from '../misc/Icons';

interface HeaderProps {
  isSyncing: boolean;
  credentials: Credentials;
  loadingService: 'discogs' | 'lastfm' | null;
  handleDiscogsConnect: () => void;
  onDiscogsLogout: () => void;
  isCollectionLoading: boolean;
  handleForceReload: () => void;
  handleLastfmConnect: () => void;
  onLastfmLogout: () => void;
  setIsSettingsOpen: (isOpen: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({
  isSyncing,
  credentials,
  loadingService,
  handleDiscogsConnect,
  onDiscogsLogout,
  isCollectionLoading,
  handleForceReload,
  handleLastfmConnect,
  onLastfmLogout,
  setIsSettingsOpen,
}) => {
  const isDiscogsConnected = !!credentials.discogsAccessToken;

  return (
    <header className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
      <div className="flex items-baseline gap-3">
        <h1 className="text-3xl font-bold">Scrobbler for Discogs</h1>
        {isSyncing && <div title="Syncing..." className="self-center"><Loader /></div>}
      </div>
      <div className="flex items-center gap-2">
        <ConnectionButton
          service="discogs"
          isConnected={isDiscogsConnected}
          username={credentials.discogsUsername}
          onConnect={handleDiscogsConnect}
          onDisconnect={onDiscogsLogout}
          isLoading={loadingService === 'discogs'}
          isDisabled={!!loadingService}
        />
        {isDiscogsConnected && (
          <button
            onClick={handleForceReload}
            className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-wait"
            aria-label="Reload collection"
            title="Reload collection from Discogs"
            disabled={isSyncing || isCollectionLoading}
          >
            <RefreshIcon className="w-6 h-6" />
          </button>
        )}
        <ConnectionButton
          service="lastfm"
          isConnected={!!credentials.lastfmSessionKey}
          username={credentials.lastfmUsername}
          onConnect={handleLastfmConnect}
          onDisconnect={onLastfmLogout}
          isLoading={loadingService === 'lastfm'}
          isDisabled={!!loadingService}
        />
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white"
          aria-label="Settings"
        >
          <SettingsIcon className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};

export default Header;