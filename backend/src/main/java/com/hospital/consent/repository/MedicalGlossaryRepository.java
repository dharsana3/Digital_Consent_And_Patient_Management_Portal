package com.hospital.consent.repository;

import com.hospital.consent.entity.MedicalGlossary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicalGlossaryRepository extends JpaRepository<MedicalGlossary, Long> {
    Optional<MedicalGlossary> findByTermIgnoreCase(String term);
    @Query("SELECT g FROM MedicalGlossary g WHERE " +
           "LOWER(g.term) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(g.category) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(g.definition) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(g.laymanExplanation) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<MedicalGlossary> searchTerms(String query);

    List<MedicalGlossary> findByCategoryIgnoreCase(String category);

    @Query("SELECT DISTINCT g.category FROM MedicalGlossary g ORDER BY g.category ASC")
    List<String> findDistinctCategories();
}
