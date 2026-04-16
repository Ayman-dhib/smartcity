package com.smartcity.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.smartcity.model.Intervention;
import com.smartcity.model.Technician;
import com.smartcity.model.Equipment;
import com.smartcity.repository.TechnicianRepository;
import com.smartcity.repository.InterventionRepository;
import com.smartcity.repository.EquipmentRepository;
import lombok.extern.slf4j.Slf4j;
import java.util.*;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;

@Service
@Slf4j
public class SmartSchedulerService {
    
    @Autowired
    private TechnicianRepository technicianRepository;
    
    @Autowired
    private InterventionRepository interventionRepository;
    
    @Autowired
    private OpenAIService openAIService;
    
    @Autowired
    private EquipmentRepository equipmentRepository;
    
    @Autowired
    private MapService mapService;

    // ===========================================================
    // METHOD 1: analyzeIntervention() - From Class Diagram
    // ===========================================================
    
    public OpenAIService.InterventionAnalysis analyzeIntervention(
            String description, String interventionType, String equipmentType) {
        log.info("🤖 Analyzing intervention: {} | {} | {}", description, interventionType, equipmentType);
        return openAIService.analyzeIntervention(description, interventionType, equipmentType);
    }
    
    public OpenAIService.InterventionAnalysis analyzeIntervention(
            String description, String interventionType) {
        return analyzeIntervention(description, interventionType, "UNKNOWN");
    }

    // ===========================================================
    // METHOD 2: findBestTechnician() - IMPROVED with debugging
    // ===========================================================
    
    public Technician findBestTechnician(Intervention intervention) {
        log.info("🔍 Finding best technician for intervention: {}", intervention.getTitle());
        log.info("📝 Description: {}", intervention.getDescription());
        
        // 1. Get intervention equipment location
        GeoJsonPoint equipmentLocation = getInterventionLocation(intervention);
        if (equipmentLocation == null) {
            log.error("❌ Intervention has no location data");
            
            // Try to get location from equipment ID
            if (intervention.getEquipmentId() != null) {
                log.info("🔄 Trying to fetch equipment location from DB...");
                Equipment equipment = equipmentRepository.findById(intervention.getEquipmentId()).orElse(null);
                if (equipment != null && equipment.getLocation() != null) {
                    equipmentLocation = equipment.getLocation();
                    log.info("✅ Got location from equipment DB: {}, {}", 
                            equipmentLocation.getX(), equipmentLocation.getY());
                }
            }
            
            if (equipmentLocation == null) {
                log.error("❌ Could not determine intervention location");
                return null;
            }
        }
        
        log.info("📍 Intervention location: longitude={}, latitude={}", 
                equipmentLocation.getX(), equipmentLocation.getY());
        
        // 2. Get nearby technicians within 50km using MapService
        log.info("🗺️ Looking for technicians within 50km radius...");
        List<Technician> nearbyTechnicians = mapService.getNearestTechnicians(
            equipmentLocation.getX(),  // longitude
            equipmentLocation.getY(),  // latitude
            50.0  // 50km radius
        );
        
        log.info("📍 MapService found {} nearby technicians", nearbyTechnicians.size());
        
        if (nearbyTechnicians.isEmpty()) {
            log.warn("⚠️ No technicians found within 50km radius");
            
            // FALLBACK: Get all available technicians
            log.info("🔄 FALLBACK: Getting all available technicians...");
            List<Technician> allTechnicians = technicianRepository.findAll();
            List<Technician> availableTechnicians = new ArrayList<>();
            for (Technician tech : allTechnicians) {
                if (tech.isAvailable()) {
                    availableTechnicians.add(tech);
                }
            }
            
            if (availableTechnicians.isEmpty()) {
                log.error("❌ No technicians available at all");
                return null;
            }
            
            log.info("🔄 Using {} available technicians from all", availableTechnicians.size());
            nearbyTechnicians = availableTechnicians;
        }
        
        // Log technicians found
        for (Technician tech : nearbyTechnicians) {
            log.info("👷 Technician: {} | Available: {} | Skills: {} | Location: {}, {}", 
                    tech.getName(), tech.isAvailable(), tech.getSkills(),
                    tech.getLocation() != null ? tech.getLocation().getX() : "N/A",
                    tech.getLocation() != null ? tech.getLocation().getY() : "N/A");
        }
        
        // 3. Pass technicians to AI for skill evaluation
        log.info("🎯 Passing {} technicians to AI for evaluation...", nearbyTechnicians.size());
        Technician bestTechnician = openAIService.findBestTechnician(intervention, nearbyTechnicians);
        
        if (bestTechnician != null) {
            log.info("✅ Selected technician: {} (ID: {})", 
                    bestTechnician.getName(), bestTechnician.getTechnicianId());
        } else {
            log.warn("⚠️ AI could not select a technician");
            
            // FALLBACK: Select first available technician
            for (Technician tech : nearbyTechnicians) {
                if (tech.isAvailable()) {
                    log.info("🔄 FALLBACK: Selecting first available technician: {}", tech.getName());
                    return tech;
                }
            }
        }
        
        return bestTechnician;
    }
    
    // ===========================================================
    // METHOD 3: mapPriority() - From Class Diagram
    // ===========================================================
    
    public String mapPriority(String aiPriority) {
        if (aiPriority == null) return "MEDIUM";
        
        switch (aiPriority.toUpperCase()) {
            case "CRITICAL": return "CRITICAL";
            case "HIGH": return "HIGH";
            case "MEDIUM": return "MEDIUM";
            case "LOW": return "LOW";
            default: return "MEDIUM";
        }
    }
    
    // ===========================================================
    // HELPER METHODS - IMPROVED
    // ===========================================================
    
    /**
     * Get equipment location from intervention - IMPROVED
     */
    private GeoJsonPoint getInterventionLocation(Intervention intervention) {
        // First try to get from equipment reference
        if (intervention.getEquipment() != null && intervention.getEquipment().getLocation() != null) {
            log.info("✅ Got location from intervention.equipment");
            return intervention.getEquipment().getLocation();
        }
        
        // If not, try to fetch equipment from DB
        if (intervention.getEquipmentId() != null) {
            log.info("🔍 Looking up equipment by ID: {}", intervention.getEquipmentId());
            Equipment equipment = equipmentRepository.findById(intervention.getEquipmentId()).orElse(null);
            if (equipment != null) {
                if (equipment.getLocation() != null) {
                    log.info("✅ Got location from equipment DB lookup");
                    // Update the intervention with equipment reference
                    intervention.setEquipment(equipment);
                    return equipment.getLocation();
                } else {
                    log.warn("⚠️ Equipment found but has no location: {}", equipment.getId());
                }
            } else {
                log.warn("⚠️ Equipment not found in DB: {}", intervention.getEquipmentId());
            }
        } else {
            log.warn("⚠️ Intervention has no equipmentId");
        }
        
        return null;
    }
    
    /**
     * Assign technician to intervention (complete method) - IMPROVED
     */
    public Map<String, Object> assignTechnicianToIntervention(String interventionId) {
        Map<String, Object> result = new HashMap<>();
        log.info("🎯 Attempting to assign technician to intervention: {}", interventionId);
        
        try {
            // 1. Get intervention
            Intervention intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> {
                    log.error("❌ Intervention not found: {}", interventionId);
                    return new RuntimeException("Intervention not found: " + interventionId);
                });
            
            log.info("📋 Intervention details:");
            log.info("   Title: {}", intervention.getTitle());
            log.info("   Description: {}", intervention.getDescription());
            log.info("   Type: {}", intervention.getInterventionType());
            log.info("   Equipment ID: {}", intervention.getEquipmentId());
            log.info("   Status: {}", intervention.getStatus());
            
            // 2. Check if already assigned
            if (intervention.getAssignedTechnicianId() != null) {
                log.warn("⚠️ Intervention already assigned to technician: {}", 
                        intervention.getAssignedTechnicianId());
                result.put("success", true);
                result.put("already_assigned", true);
                result.put("technicianId", intervention.getAssignedTechnicianId());
                result.put("message", "Intervention already assigned");
                return result;
            }
            
            // 3. Find best technician
            log.info("🔍 Finding best technician...");
            Technician bestTechnician = findBestTechnician(intervention);
            
            if (bestTechnician == null) {
                log.error("❌ No suitable technician found");
                result.put("success", false);
                result.put("message", "No suitable technician found");
                result.put("details", "No available technicians with required skills in the area");
                return result;
            }
            
            log.info("✅ Selected technician: {} (ID: {})", 
                    bestTechnician.getName(), bestTechnician.getTechnicianId());
            
            // 4. Get AI analysis for priority
            String equipmentType = "UNKNOWN";
            if (intervention.getEquipment() != null && intervention.getEquipment().getType() != null) {
                equipmentType = intervention.getEquipment().getType().toString();
            } else if (intervention.getEquipmentId() != null) {
                Equipment equipment = equipmentRepository.findById(intervention.getEquipmentId()).orElse(null);
                if (equipment != null && equipment.getType() != null) {
                    equipmentType = equipment.getType().toString();
                }
            }
            
            log.info("🤖 Getting AI analysis for priority...");
            OpenAIService.InterventionAnalysis analysis = analyzeIntervention(
                intervention.getDescription(),
                intervention.getInterventionType(),
                equipmentType
            );
            
            log.info("🤖 AI Analysis: Priority={}, Urgency={}, Skills={}", 
                    analysis.getPriority(), analysis.getUrgency(), analysis.getSkills());
            
            // 5. Update intervention
            intervention.setAssignedTechnicianId(bestTechnician.getTechnicianId());
            intervention.setStatus("IN_PROGRESS");
            intervention.setPriority(mapPriority(analysis.getPriority()));
            intervention.setPriorityScore(analysis.getUrgency() * 10);
            
            // 6. Update technician workload
            bestTechnician.increaseWorkload();
            if (bestTechnician.getCurrentWorkload() >= 5) {
                bestTechnician.setAvailable(false);
                log.info("⚠️ Technician {} reached max workload (5), marking as unavailable", 
                        bestTechnician.getName());
            }
            
            // 7. Update equipment status
            if (intervention.getEquipmentId() != null) {
                equipmentRepository.findById(intervention.getEquipmentId())
                    .ifPresent(equipment -> {
                        equipment.setStatus("PENDING");
                        equipmentRepository.save(equipment);
                        log.info("🛠️ Updated equipment status to PENDING: {}", equipment.getName());
                    });
            }
            
            // 8. Save all changes
            interventionRepository.save(intervention);
            technicianRepository.save(bestTechnician);
            
            log.info("💾 Saved changes to database");
            
            // 9. Return success
            result.put("success", true);
            result.put("message", "Technician assigned successfully");
            result.put("technician", Map.of(
                "id", bestTechnician.getTechnicianId(),
                "name", bestTechnician.getName(),
                "skills", bestTechnician.getSkills(),
                "currentWorkload", bestTechnician.getCurrentWorkload(),
                "available", bestTechnician.isAvailable()
            ));
            result.put("intervention", Map.of(
                "id", intervention.getInterventionId(),
                "title", intervention.getTitle(),
                "priority", intervention.getPriority(),
                "priorityScore", intervention.getPriorityScore(),
                "assignedTechnicianId", intervention.getAssignedTechnicianId()
            ));
            
            log.info("🎉 Technician assignment successful!");
            
        } catch (Exception e) {
            log.error("❌ Error assigning technician: {}", e.getMessage());
            e.printStackTrace();
            result.put("success", false);
            result.put("message", "Assignment failed: " + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * Get intervention details with equipment info - IMPROVED
     */
    public Map<String, Object> getInterventionDetails(String interventionId) {
        Map<String, Object> details = new HashMap<>();
        log.info("📋 Getting details for intervention: {}", interventionId);
        
        try {
            Intervention intervention = interventionRepository.findById(interventionId)
                .orElseThrow(() -> new RuntimeException("Intervention not found"));
            
            details.put("interventionId", intervention.getInterventionId());
            details.put("title", intervention.getTitle());
            details.put("description", intervention.getDescription());
            details.put("status", intervention.getStatus());
            details.put("priority", intervention.getPriority());
            details.put("hasEquipmentId", intervention.getEquipmentId() != null);
            details.put("equipmentId", intervention.getEquipmentId());
            details.put("assignedTechnicianId", intervention.getAssignedTechnicianId());
            
            // Get equipment details if exists
            if (intervention.getEquipmentId() != null) {
                equipmentRepository.findById(intervention.getEquipmentId())
                    .ifPresent(equipment -> {
                        details.put("equipmentName", equipment.getName());
                        details.put("equipmentType", equipment.getType());
                        details.put("equipmentStatus", equipment.getStatus());
                        details.put("hasLocation", equipment.getLocation() != null);
                        
                        if (equipment.getLocation() != null) {
                            details.put("latitude", equipment.getLocation().getY());
                            details.put("longitude", equipment.getLocation().getX());
                        }
                    });
            }
            
            // Get technician details if assigned
            if (intervention.getAssignedTechnicianId() != null) {
                technicianRepository.findById(intervention.getAssignedTechnicianId())
                    .ifPresent(technician -> {
                        details.put("assignedTechnician", Map.of(
                            "name", technician.getName(),
                            "skills", technician.getSkills(),
                            "available", technician.isAvailable(),
                            "currentWorkload", technician.getCurrentWorkload(),
                            "rating", technician.getRating()
                        ));
                    });
            }
            
            log.info("✅ Retrieved intervention details successfully");
            
        } catch (Exception e) {
            log.error("❌ Error getting intervention details: {}", e.getMessage());
            details.put("error", e.getMessage());
        }
        
        return details;
    }
    
    /**
     * AUTO-ASSIGN technician to PENDING interventions - NEW METHOD
     */
    public Map<String, Object> autoAssignPendingInterventions() {
        Map<String, Object> result = new HashMap<>();
        log.info("🤖 Starting auto-assignment of pending interventions...");
        
        try {
            // Get all PENDING interventions
            List<Intervention> pendingInterventions = interventionRepository.findByStatus("PENDING");
            log.info("📋 Found {} pending interventions", pendingInterventions.size());
            
            int assignedCount = 0;
            int failedCount = 0;
            List<Map<String, Object>> assignments = new ArrayList<>();
            
            for (Intervention intervention : pendingInterventions) {
                log.info("🔍 Processing intervention: {} - {}", 
                        intervention.getInterventionId(), intervention.getTitle());
                
                try {
                    Map<String, Object> assignmentResult = assignTechnicianToIntervention(
                        intervention.getInterventionId());
                    
                    if (Boolean.TRUE.equals(assignmentResult.get("success"))) {
                        assignedCount++;
                        assignments.add(assignmentResult);
                        log.info("✅ Assigned technician to intervention: {}", 
                                intervention.getInterventionId());
                    } else {
                        failedCount++;
                        log.warn("⚠️ Failed to assign intervention {}: {}", 
                                intervention.getInterventionId(), assignmentResult.get("message"));
                    }
                    
                    // Small delay to avoid overwhelming the system
                    Thread.sleep(100);
                    
                } catch (Exception e) {
                    failedCount++;
                    log.error("❌ Error assigning intervention {}: {}", 
                            intervention.getInterventionId(), e.getMessage());
                }
            }
            
            result.put("success", true);
            result.put("message", "Auto-assignment completed");
            result.put("total_pending", pendingInterventions.size());
            result.put("assigned", assignedCount);
            result.put("failed", failedCount);
            result.put("assignments", assignments);
            
            log.info("🎉 Auto-assignment completed: {}/{} interventions assigned", 
                    assignedCount, pendingInterventions.size());
            
        } catch (Exception e) {
            log.error("❌ Error in auto-assignment: {}", e.getMessage());
            result.put("success", false);
            result.put("message", "Auto-assignment failed: " + e.getMessage());
        }
        
        return result;
    }
}