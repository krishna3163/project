package com.dsatracker.repository;

import com.dsatracker.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByXpPointsGreaterThan(int xpPoints);
}
