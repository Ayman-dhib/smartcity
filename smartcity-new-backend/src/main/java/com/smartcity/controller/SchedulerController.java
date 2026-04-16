package com.smartcity.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.smartcity.service.SmartSchedulerService;
import com.smartcity.service.OpenAIService;
import com.smartcity.repository.InterventionRepository;
import com.smartcity.repository.TechnicianRepository;
import com.smartcity.repository.EquipmentRepository;
import com.smartcity.model.*;
import java.util.*;

@RestController
@RequestMapping("/api/scheduler")
@CrossOrigin(origins = "*")
public class SchedulerController {
    
    @Autowired
    private SmartSchedulerService smartSchedulerService;
    
    @Autowired
    private OpenAIService openAIService;
    
    @Autowired
    private InterventionRepository interventionRepository;
    
    @Autowired
    private TechnicianRepository technicianRepository;
    
    @Autowired
    private EquipmentRepository equipmentRepository;

    // ==== VALIDATION ====
    
    private Map<String, Object> validateInterventionWithEquipment(String interventionId) {
        Map<String, Object> result = new HashMap<>();
        
        Optional<Intervention> interventionOpt = interventionRepository.findById(interventionId);
        if (interventionOpt.isEmpty()) {
            result.put("valid", false);
            result.put("error", "Intervention not found");
            return result;
        }
        
        Intervention intervention = interventionOpt.get();
        
        if (intervention.getEquipmentId() == null) {
            result.put("valid", false);
            result.put("error", "Intervention has no equipment reference");
            return result;
        }
        
        Optional<Equipment> equipmentOpt = equipmentRepository.findById(intervention.getEquipmentId());
        if (equipmentOpt.isEmpty()) {
            result.put("valid", false);
            result.put("error", "Referenced equipment not found");
            return result;
        }
        
        result.put("valid", true);
        result.put("intervention", intervention);
        result.put("equipment", equipmentOpt.get());
        return result;
    }

    // ==== MAIN ENDPOINTS ====
    
    @PostMapping("/assign-technician")
    public ResponseEntity<Map<String, Object>> assignTechnician(@RequestParam String interventionId) {
        try {
            System.out.println("🎯 POST /api/scheduler/assign-technician?interventionId=" + interventionId);
            
            Map<String, Object> validation = validateInterventionWithEquipment(interventionId);
            if (!(Boolean) validation.get("valid")) {
                System.out.println("❌ Validation failed: " + validation.get("error"));
                return ResponseEntity.badRequest().body(Map.of(
                    "error", validation.get("error"),
                    "interventionId", interventionId,
                    "assigned", false
                ));
            }
            
            Intervention intervention = (Intervention) validation.get("intervention");
            Equipment equipment = (Equipment) validation.get("equipment");
            
            System.out.println("📋 Intervention: " + intervention.getTitle());
            System.out.println("📋 Description: " + intervention.getDescription());
            System.out.println("🔧 Equipment: " + equipment.getName());
            
            Technician bestTechnician = smartSchedulerService.findBestTechnician(intervention);
            
            if (bestTechnician == null) {
                System.out.println("❌ No available technicians found");
                return ResponseEntity.ok(Map.of(
                    "message", "No available technicians found",
                    "interventionId", interventionId,
                    "equipmentId", equipment.getId(),
                    "assigned", false,
                    "details", "No technicians available with required skills and location"
                ));
            }
            
            System.out.println("✅ Selected technician: " + bestTechnician.getName() + 
                             " (Skills: " + bestTechnician.getSkills() + ")");
            
            // Update technician
            bestTechnician.increaseWorkload();
            technicianRepository.save(bestTechnician);
            
            // Update intervention
            intervention.setStatus("IN_PROGRESS");
            intervention.setAssignedTechnicianId(bestTechnician.getTechnicianId());
            
            // Get AI analysis for priority
            String equipmentType = equipment.getType() != null ? equipment.getType().toString() : "UNKNOWN";
            OpenAIService.InterventionAnalysis analysis = openAIService.analyzeIntervention(
                intervention.getDescription(), 
                intervention.getInterventionType(),
                equipmentType
            );
            
            System.out.println("🤖 AI Analysis - Priority: " + analysis.getPriority() + 
                             ", Urgency: " + analysis.getUrgency() + 
                             ", Skills: " + analysis.getSkills());
            
            intervention.setPriority(smartSchedulerService.mapPriority(analysis.getPriority()));
            intervention.setPriorityScore(analysis.getUrgency() * 10);
            interventionRepository.save(intervention);
            
            // Update equipment
            equipment.setStatus("PENDING");
            equipmentRepository.save(equipment);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Technician assigned successfully");
            response.put("interventionId", interventionId);
            response.put("equipmentId", equipment.getId());
            response.put("equipmentName", equipment.getName());
            response.put("technicianId", bestTechnician.getTechnicianId());
            response.put("technicianName", bestTechnician.getName());
            response.put("technicianSkills", bestTechnician.getSkills());
            response.put("assigned", true);
            response.put("aiPriority", analysis.getPriority());
            response.put("aiUrgencyScore", analysis.getUrgency());
            response.put("mappedPriority", smartSchedulerService.mapPriority(analysis.getPriority()));
            
            System.out.println("✅ Assignment successful!");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Error in assign-technician: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Failed to assign technician",
                "details", e.getMessage(),
                "interventionId", interventionId,
                "assigned", false
            ));
        }
    }

    @PostMapping("/ai-process")
    public ResponseEntity<Map<String, Object>> aiProcessIntervention(@RequestParam String interventionId) {
        try {
            System.out.println("🤖 POST /api/scheduler/ai-process?interventionId=" + interventionId);
            
            Map<String, Object> validation = validateInterventionWithEquipment(interventionId);
            if (!(Boolean) validation.get("valid")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", validation.get("error"),
                    "interventionId", interventionId,
                    "processed", false
                ));
            }
            
            Intervention intervention = (Intervention) validation.get("intervention");
            Equipment equipment = (Equipment) validation.get("equipment");
            
            String equipmentType = equipment.getType() != null ? equipment.getType().toString() : "UNKNOWN";
            OpenAIService.InterventionAnalysis analysis = 
                openAIService.analyzeIntervention(
                    intervention.getDescription(), 
                    intervention.getInterventionType(),
                    equipmentType
                );
            
            Technician bestTechnician = smartSchedulerService.findBestTechnician(intervention);
            
            Map<String, Object> result = new HashMap<>();
            result.put("interventionId", interventionId);
            result.put("interventionTitle", intervention.getTitle());
            result.put("description", intervention.getDescription());
            result.put("interventionType", intervention.getInterventionType());
            result.put("equipmentId", equipment.getId());
            result.put("equipmentName", equipment.getName());
            result.put("equipmentType", equipment.getType());
            result.put("aiPriority", analysis.getPriority());
            result.put("aiUrgencyScore", analysis.getUrgency());
            result.put("aiRecommendedSkills", analysis.getSkills());
            
            if (bestTechnician != null) {
                result.put("assigned", true);
                result.put("technicianId", bestTechnician.getTechnicianId());
                result.put("technicianName", bestTechnician.getName());
                result.put("technicianSkills", bestTechnician.getSkills());
                result.put("technicianAvailable", bestTechnician.isAvailable());
                result.put("technicianWorkload", bestTechnician.getCurrentWorkload());
                result.put("message", "AI successfully processed and assigned technician");
            } else {
                result.put("assigned", false);
                result.put("message", "AI processed but no technicians available");
            }
            
            System.out.println("✅ AI Process completed for intervention: " + interventionId);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            System.err.println("❌ Error in ai-process: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "AI processing failed",
                "details", e.getMessage(),
                "interventionId", interventionId
            ));
        }
    }

    @GetMapping("/analyze-intervention")
    public ResponseEntity<Map<String, Object>> analyzeIntervention(@RequestParam String interventionId) {
        try {
            System.out.println("🔍 GET /api/scheduler/analyze-intervention?interventionId=" + interventionId);
            
            Map<String, Object> validation = validateInterventionWithEquipment(interventionId);
            if (!(Boolean) validation.get("valid")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", validation.get("error"),
                    "interventionId", interventionId
                ));
            }
            
            Intervention intervention = (Intervention) validation.get("intervention");
            Equipment equipment = (Equipment) validation.get("equipment");
            
            String equipmentType = equipment.getType() != null ? equipment.getType().toString() : "UNKNOWN";
            OpenAIService.InterventionAnalysis analysis = 
                openAIService.analyzeIntervention(
                    intervention.getDescription(), 
                    intervention.getInterventionType(),
                    equipmentType
                );
            
            Map<String, Object> response = new HashMap<>();
            response.put("interventionId", interventionId);
            response.put("title", intervention.getTitle());
            response.put("description", intervention.getDescription());
            response.put("type", intervention.getInterventionType());
            response.put("equipment", Map.of(
                "id", equipment.getId(),
                "name", equipment.getName(),
                "type", equipment.getType(),
                "status", equipment.getStatus()
            ));
            response.put("aiPriority", analysis.getPriority());
            response.put("aiUrgencyScore", analysis.getUrgency());
            response.put("aiRecommendedSkills", analysis.getSkills());
            response.put("mappedPriority", smartSchedulerService.mapPriority(analysis.getPriority()));
            
            System.out.println("✅ Analysis completed for intervention: " + interventionId);
            System.out.println("   AI Priority: " + analysis.getPriority());
            System.out.println("   Recommended Skills: " + analysis.getSkills());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Error in analyze-intervention: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to analyze intervention",
                "details", e.getMessage(),
                "interventionId", interventionId
            ));
        }
    }

    @GetMapping("/pending")
    public ResponseEntity<Map<String, Object>> getPendingInterventions() {
        try {
            System.out.println("📋 GET /api/scheduler/pending");
            
            // Use String status "PENDING" instead of enum
            List<Intervention> pendingInterventions = interventionRepository.findByStatus("PENDING");
            
            List<Map<String, Object>> pendingList = new ArrayList<>();
            for (Intervention intervention : pendingInterventions) {
                Map<String, Object> interventionMap = new HashMap<>();
                interventionMap.put("id", intervention.getInterventionId());
                interventionMap.put("title", intervention.getTitle());
                interventionMap.put("description", intervention.getDescription());
                interventionMap.put("type", intervention.getInterventionType());
                interventionMap.put("priority", intervention.getPriority());
                interventionMap.put("equipmentId", intervention.getEquipmentId());
                interventionMap.put("createdDate", intervention.getCreatedDate());
                
                // Get equipment name
                if (intervention.getEquipmentId() != null) {
                    equipmentRepository.findById(intervention.getEquipmentId())
                        .ifPresent(equipment -> {
                            interventionMap.put("equipmentName", equipment.getName());
                            interventionMap.put("equipmentType", equipment.getType());
                        });
                }
                
                pendingList.add(interventionMap);
            }
            
            System.out.println("✅ Found " + pendingInterventions.size() + " pending interventions");
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "count", pendingInterventions.size(),
                "pendingInterventions", pendingList
            ));
            
        } catch (Exception e) {
            System.err.println("❌ Error in getPendingInterventions: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Failed to get pending interventions",
                "details", e.getMessage()
            ));
        }
    }
    
    // ========== NEW ENDPOINTS ==========
    
    @PostMapping("/auto-assign")
    public ResponseEntity<Map<String, Object>> autoAssignAllPending() {
        try {
            System.out.println("🤖 POST /api/scheduler/auto-assign - Auto-assigning all pending interventions");
            
            Map<String, Object> result = smartSchedulerService.autoAssignPendingInterventions();
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            System.err.println("❌ Error in auto-assign: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Auto-assignment failed",
                "details", e.getMessage()
            ));
        }
    }
    
    @GetMapping("/test-assign/{interventionId}")
    public ResponseEntity<Map<String, Object>> testAssign(@PathVariable String interventionId) {
        try {
            System.out.println("🧪 GET /api/scheduler/test-assign/" + interventionId + " - Testing assignment logic");
            
            // First analyze
            Map<String, Object> analysisResult = new HashMap<>();
            Map<String, Object> validation = validateInterventionWithEquipment(interventionId);
            if (!(Boolean) validation.get("valid")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", validation.get("error"),
                    "interventionId", interventionId
                ));
            }
            
            Intervention intervention = (Intervention) validation.get("intervention");
            Equipment equipment = (Equipment) validation.get("equipment");
            
            String equipmentType = equipment.getType() != null ? equipment.getType().toString() : "UNKNOWN";
            OpenAIService.InterventionAnalysis analysis = openAIService.analyzeIntervention(
                intervention.getDescription(), 
                intervention.getInterventionType(),
                equipmentType
            );
            
            // Get nearby technicians
            List<com.smartcity.model.Technician> nearbyTechnicians = Collections.emptyList();
            if (intervention.getEquipment() != null && intervention.getEquipment().getLocation() != null) {
                var mapService = new com.smartcity.service.MapService(
                    equipmentRepository, technicianRepository, interventionRepository, 
                    new com.smartcity.service.OsrmService()
                );
                nearbyTechnicians = mapService.getNearestTechnicians(
                    intervention.getEquipment().getLocation().getX(),
                    intervention.getEquipment().getLocation().getY(),
                    50.0
                );
            }
            
            analysisResult.put("intervention", Map.of(
                "id", intervention.getInterventionId(),
                "title", intervention.getTitle(),
                "description", intervention.getDescription(),
                "type", intervention.getInterventionType(),
                "equipmentId", intervention.getEquipmentId()
            ));
            
            analysisResult.put("aiAnalysis", Map.of(
                "priority", analysis.getPriority(),
                "urgency", analysis.getUrgency(),
                "skills", analysis.getSkills(),
                "mappedPriority", smartSchedulerService.mapPriority(analysis.getPriority())
            ));
            
            analysisResult.put("technicians", nearbyTechnicians.stream()
                .map(t -> Map.of(
                    "id", t.getTechnicianId(),
                    "name", t.getName(),
                    "skills", t.getSkills(),
                    "available", t.isAvailable(),
                    "workload", t.getCurrentWorkload(),
                    "location", t.getLocation() != null ? 
                        Map.of("lat", t.getLocation().getY(), "lng", t.getLocation().getX()) : null
                ))
                .collect(java.util.stream.Collectors.toList()));
            
            analysisResult.put("technicianCount", nearbyTechnicians.size());
            
            // Then try to assign
            ResponseEntity<Map<String, Object>> assignmentResponse = assignTechnician(interventionId);
            
            Map<String, Object> finalResult = new HashMap<>();
            finalResult.put("analysis", analysisResult);
            finalResult.put("assignment", assignmentResponse.getBody());
            
            return ResponseEntity.ok(finalResult);
            
        } catch (Exception e) {
            System.err.println("❌ Error in test-assign: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Test assignment failed",
                "details", e.getMessage(),
                "interventionId", interventionId
            ));
        }
    }
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "Smart City Scheduler");
        health.put("timestamp", new java.util.Date());
        
        try {
            long interventionCount = interventionRepository.count();
            long technicianCount = technicianRepository.count();
            long equipmentCount = equipmentRepository.count();
            
            // Count by status
            long pendingCount = interventionRepository.findByStatus("PENDING").size();
            long inProgressCount = interventionRepository.findByStatus("IN_PROGRESS").size();
            long completedCount = interventionRepository.findByStatus("COMPLETED").size();
            
            // Count available technicians
            long availableTechnicians = technicianRepository.findAll().stream()
                .filter(Technician::isAvailable)
                .count();
            
            health.put("database", "Connected");
            health.put("counts", Map.of(
                "interventions", interventionCount,
                "technicians", technicianCount,
                "equipment", equipmentCount,
                "availableTechnicians", availableTechnicians
            ));
            
            health.put("interventionStatus", Map.of(
                "PENDING", pendingCount,
                "IN_PROGRESS", inProgressCount,
                "COMPLETED", completedCount
            ));
            
        } catch (Exception e) {
            health.put("database", "Error: " + e.getMessage());
        }
        
        return ResponseEntity.ok(health);
    }
}