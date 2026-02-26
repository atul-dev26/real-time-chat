package com.chatapp.realtime_chat.service;

import com.chatapp.realtime_chat.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    // A secret key for signing tokens (In production, this should be in
    // application.properties)
    private static final String SECRET_KEY = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractSessionId(String token) {
        return extractClaim(token, claims -> claims.get("sid", String.class));
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return Jwts
                .builder()
                .claims(extraClaims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24)) // 24 hours
                .signWith(getSignInKey())
                .compact();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        final String sessionId = extractSessionId(token);

        boolean isSessionValid = true;
        if (userDetails instanceof User) {
            String currentSessionId = ((User) userDetails).getCurrentSessionId();

            // Session validation logic:
            // 1. If both DB and token have session IDs, they must match
            // 2. If DB has no session (null), this could be a new registration or legacy
            // user
            // 3. If token has no session but DB does, reject

            if (currentSessionId != null && sessionId != null) {
                isSessionValid = currentSessionId.equals(sessionId);
            } else if (currentSessionId != null && sessionId == null) {
                isSessionValid = false;
            } else if (currentSessionId == null && sessionId != null) {
                // DB has no session but token does -> allow (initial login/register)
                isSessionValid = true;
            }
        }

        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token) && isSessionValid;
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts
                .parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(SECRET_KEY);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
