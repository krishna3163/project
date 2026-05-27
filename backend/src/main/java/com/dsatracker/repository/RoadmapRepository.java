package com.dsatracker.repository;

import com.dsatracker.model.Roadmap;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface RoadmapRepository extends MongoRepository<Roadmap, String> {
    Optional<Roadmap> findByCompanyNameIgnoreCase(String companyName);
}
