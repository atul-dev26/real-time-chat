import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './Notifications.css';

const Notifications = () => {
    const { currentUser: user } = useAuth();
    const navigate = useNavigate();
    const [incoming, setIncoming] = useState([]);
    const [outgoing, setOutgoing] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const refresh = async () => {
        try {
            const [incomingData, outgoingData] = await Promise.all([
                requestService.getIncomingRequests(user.id),
                requestService.getOutgoingRequests(user.id)
            ]);
            setIncoming(incomingData);
            setOutgoing(outgoingData);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    useEffect(() => {
        refresh();
    }, [user.id]);

    const handleAccept = async (requestId) => {
        setLoading(true);
        setError('');
        try {
            await requestService.acceptRequest(requestId, user.id);
            await refresh();
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
        try {
            await requestService.rejectRequest(requestId, user.id);
            await refresh();
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to reject request.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const renderStatus = (status) => {
        if (status === 'ACCEPTED') return <span className="notif-pill accepted">Accepted</span>;
        if (status === 'REJECTED') return <span className="notif-pill rejected">Rejected</span>;
        return <span className="notif-pill">Pending</span>;
    };

    return (
        <div className="notifications-dashboard glass">
            <div className="notifications-header">
                <button className="notif-btn" onClick={() => navigate('/')}>Back to Chat</button>
                <div>
                    <h2>Friend Requests</h2>
                    <p>Track who sent you requests and the status of your own.</p>
                </div>
                <button className="notif-btn" onClick={() => navigate('/discover')}>Find Friends</button>
            </div>

            {error && <div className="notif-alert">{error}</div>}

            <div className="notifications-grid">
                <div className="notifications-panel">
                    <h3>Incoming Requests</h3>
                    {incoming.length === 0 ? (
                        <div className="notif-empty">No incoming requests.</div>
                    ) : (
                        incoming.map(req => (
                            <div key={req.id} className="notif-item">
                                <div className="notif-user">
                                    <div className="notif-avatar">
                                        {req.senderProfilePicture ? (
                                            <img src={req.senderProfilePicture} alt={req.senderUsername} />
                                        ) : (
                                            req.senderUsername.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <h4>{req.senderUsername}</h4>
                                        <p>{req.senderFullName || '—'}</p>
                                    </div>
                                </div>
                                <div className="notif-actions">
                                    {req.status === 'PENDING' ? (
                                        <div className="notif-inline">
                                            <button className="notif-btn primary" onClick={() => handleAccept(req.id)} disabled={loading}>
                                                Accept
                                            </button>
                                            <button className="notif-btn" onClick={() => handleReject(req.id)} disabled={loading}>
                                                Decline
                                            </button>
                                        </div>
                                    ) : (
                                        renderStatus(req.status)
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="notifications-panel">
                    <h3>Outgoing Requests</h3>
                    {outgoing.length === 0 ? (
                        <div className="notif-empty">No outgoing requests.</div>
                    ) : (
                        outgoing.map(req => (
                            <div key={req.id} className="notif-item">
                                <div className="notif-user">
                                    <div className="notif-avatar">
                                        {req.receiverProfilePicture ? (
                                            <img src={req.receiverProfilePicture} alt={req.receiverUsername} />
                                        ) : (
                                            req.receiverUsername.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <h4>{req.receiverUsername}</h4>
                                        <p>{req.receiverFullName || '—'}</p>
                                    </div>
                                </div>
                                <div className="notif-actions">
                                    {renderStatus(req.status)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
