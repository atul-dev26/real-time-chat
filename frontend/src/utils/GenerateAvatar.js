export const generateAvatar = () => {
    const avatarStyles = ['adventurer', 'avataaars', 'bottts', 'pixel-art', 'lorelei'];
    const avatars = [];

    for (let i = 0; i < 9; i++) {
        const style = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
        const seed = Math.random().toString(36).substring(7);
        avatars.push(`https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`);
    }

    return avatars;
};
