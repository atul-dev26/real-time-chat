import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { generateAvatar } from "../../utils/GenerateAvatar";
import FullScreenLoader from "@/components/ui/full-screen-loader";
import "./Profile.css";
import "../Auth/Auth.css"; // Reuse input styles

export default function Profile() {
    const navigate = useNavigate();
    const { currentUser, updateUserProfile, setError, error } = useAuth();

    const [username, setUsername] = useState(currentUser?.fullName || "");
    const [avatars, setAvatars] = useState([]);
    const [selectedAvatar, setSelectedAvatar] = useState();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = () => {
            const generated = generateAvatar();
            if (currentUser?.profilePicture) {
                // Check if already in the list to avoid duplication (unlikely but safe)
                if (!generated.includes(currentUser.profilePicture)) {
                    setAvatars([currentUser.profilePicture, ...generated.slice(0, 8)]);
                    setSelectedAvatar(0); // Select the current one by default
                } else {
                    setAvatars(generated);
                    setSelectedAvatar(generated.indexOf(currentUser.profilePicture));
                }
            } else {
                setAvatars(generated);
            }
        };
        fetchData();
    }, [currentUser]);

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        if (selectedAvatar === undefined && !currentUser.profilePicture) {
            return setError("Please select an avatar");
        }

        try {
            setError("");
            setLoading(true);
            const profile = {
                displayName: username,
                photoURL: selectedAvatar !== undefined ? avatars[selectedAvatar] : currentUser.profilePicture,
            };
            await updateUserProfile(currentUser, profile);
            navigate("/");
        } catch (err) {
            setError("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-auth-wrapper">
            <div className="profile-container">
                <div className="profile-card">
                    <h2>Pick an avatar</h2>

                    {error && <div className="error-msg">{error}</div>}

                    <form onSubmit={handleFormSubmit}>
                        <div className="avatar-grid">
                            {avatars.map((avatar, index) => (
                                <div
                                    key={index}
                                    className={`avatar-item ${index === selectedAvatar ? "selected" : ""}`}
                                    onClick={() => setSelectedAvatar(index)}
                                >
                                    <img src={avatar} alt={`Avatar ${index}`} />
                                </div>
                            ))}
                        </div>

                        <div className="form-group">
                            <div className="neu-input">
                                <input
                                    type="text"
                                    id="username"
                                    required
                                    placeholder=" "
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                                <label htmlFor="username">Display Name</label>
                                <div className="input-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="profile-btn"
                        >
                            {loading ? "Updating..." : "Save Profile"}
                        </button>
                    </form>
                </div>
            </div>
            {loading && <FullScreenLoader />}
        </div>
    );
}
