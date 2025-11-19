import { useLocalStorage } from './useLocalStorage';
import type { Credentials } from '../types';

const initialCredentials: Credentials = {
    discogsUsername: '',
    discogsAccessToken: '',
    discogsAccessTokenSecret: '',
    lastfmApiKey: '',
    lastfmSecret: '',
    lastfmSessionKey: '',
    lastfmUsername: '',
};

export function useCredentials() {
    const [credentials, setCredentials] = useLocalStorage<Credentials>('vinyl-scrobbler-credentials', initialCredentials);

    const onCredentialsChange = (newCredentials: Partial<Credentials>) => {
        setCredentials(prev => ({ ...prev, ...newCredentials }));
    };
    
    const handleDiscogsLogout = () => {
        setCredentials(prev => ({
            ...prev,
            discogsUsername: '',
            discogsAccessToken: '',
            discogsAccessTokenSecret: '',
        }));
    };
    
    const handleLastfmLogout = () => {
        setCredentials(prev => ({
            ...prev,
            lastfmApiKey: '',
            lastfmSecret: '',
            lastfmSessionKey: '',
            lastfmUsername: '',
        }));
    };

    return {
        credentials,
        onCredentialsChange,
        handleDiscogsLogout,
        handleLastfmLogout,
    };
}
