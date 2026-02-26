import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestService, userService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './Discover.css';

const MIN_QUERY_LENGTH = 2;

const Discover = () => {
    const { currentUser: user } = useAuth();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [incoming, setIncoming] = useState([]);
    const [outgoing, setOutgoing] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    const refreshRequests = async () => {
        try {
            const [incomingData, outgoingData, contactsData] = await Promise.all([
                requestService.getIncomingRequests(user.id),
                requestService.getOutgoingRequests(user.id),
                userService.getContacts(user.id)
            ]);
            setIncoming(incomingData);
            setOutgoing(outgoingData);
            setContacts(contactsData);
        } catch (err) {
            console.error('Failed to load requests', err);
        }
    };

    useEffect(() => {
        refreshRequests();
    }, [user.id]);

    const handleSearch = async (e) => {
        e.preventDefault();
        setError('');
        setInfo('');
        if (query.trim().length < MIN_QUERY_LENGTH) {
            setResults([]);
            setError(`Type at least ${MIN_QUERY_LENGTH} characters to search.`);
            return;
        }
        setLoading(true);
        try {
            const data = await userService.searchUsers(query.trim(), user.id);
            setResults(data);
        } catch (err) {
            console.error('Search failed', err);
            setError('Search failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendRequest = async (receiverId) => {
        setLoading(true);
        setError('');
        setInfo('');
        try {
            await requestService.sendRequest(user.id, receiverId);
            setInfo('Request sent.');
            await refreshRequests();
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to send request.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (requestId) => {
        setLoading(true);
        setError('');
        setInfo('');
        try {
            await requestService.acceptRequest(requestId, user.id);
            setInfo('Request accepted.');
            await refreshRequests();
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to accept request.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (requestId) => {
        setLoading(true);
        setError('');
        setInfo('');
        try {
            await requestService.rejectRequest(requestId, user.id);
            setInfo('Request rejected.');
            await refreshRequests();
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to reject request.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const statusMap = useMemo(() => {
        const map = new Map();
        contacts.forEach(c => map.set(c.id, { type: 'connected' }));
        outgoing.forEach(r => {
            map.set(r.receiverId, { type: 'outgoing', status: r.status, requestId: r.id });
        });
        incoming.forEach(r => {
            map.set(r.senderId, { type: 'incoming', status: r.status, requestId: r.id });
        });
        return map;
    }, [contacts, incoming, outgoing]);

    return (
        <div className="discover-dashboard glass">
            <div className="discover-header">
                <button className="discover-btn" onClick={() => navigate('/')}>Back to Chat</button>
                <div className="discover-title">
                    <h2>Find Friends</h2>
                    <p>Search by username and send a request to start chatting.</p>
                </div>
                <button className="discover-btn" onClick={() => navigate('/notifications')}>Notifications</button>
            </div>

            <form className="discover-search" onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Search username..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <button className="discover-btn primary" type="submit" disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            {error && <div className="discover-alert error">{error}</div>}
            {info && <div className="discover-alert">{info}</div>}

            <div className="discover-results">
                {results.length === 0 ? (
                    <div className="discover-empty">Search for a username to send a request.</div>
                ) : (
                    results.map(r => {
                        const status = statusMap.get(r.id);
                        return (
                            <div key={r.id} className="discover-card">
                                <div className="discover-user">
                                    <div className="discover-avatar">
                                        {r.profilePicture ? (
                                            <img src={r.profilePicture} alt={r.username} />
                                        ) : (
                                            r.username.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <h4>{r.username}</h4>
                                        <p>{r.fullName || '—'}</p>
                                    </div>
                                </div>
                                <div className="discover-actions">
                                    {status?.type === 'connected' || status?.status === 'ACCEPTED' ? (
                                        <span className="status-pill success">Connected</span>
                                    ) : status?.type === 'outgoing' && status?.status === 'PENDING' ? (
                                        <span className="status-pill">Request Sent</span>
                                    ) : status?.type === 'incoming' && status?.status === 'PENDING' ? (
                                        <div className="inline-actions">
                                            <button className="discover-btn primary" onClick={() => handleAccept(status.requestId)} disabled={loading}>
                                                Accept
                                            </button>
                                            <button className="discover-btn" onClick={() => handleReject(status.requestId)} disabled={loading}>
                                                Decline
                                            </button>
                                        </div>
                                    ) : (
                                        <button className="discover-btn primary" onClick={() => handleSendRequest(r.id)} disabled={loading}>
                                            Send Request
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Discover;
