package com.smartcity.service;

import com.smartcity.model.*;
import com.smartcity.repository.InterventionRepository;
import com.smartcity.repository.TechnicianRepository;
import com.smartcity.repository.EquipmentRepository;
import com.smartcity.dto.RatingRequestDTO;
import com.smartcity.dto.RatingResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class InterventionService {

    private final INotificationService notificationService;
    private final SmartSchedulerService smartSchedulerService;
    private final TechnicianRepository technicianRepository;
    private final InterventionRepository interventionRepository;
    private final EquipmentRepository equipmentRepository;

    /**
     * Create intervention for SPECIFIC EQUIPMENT
     */
    public Intervention createInterventionForEquipment(String citizenId, String equipmentId,
            String description, String interventionType) {

        log.info("🆕 Creating intervention for equipment: {}", equipmentId);

        // 1. Validate equipment exists
        Equipment equipment = equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new RuntimeException("Equipment not found: " + equipmentId));

        // 2. Get AI analysis with equipment context
        String equipmentType = equipment.getType() != null ? equipment.getType().toString() : "UNKNOWN";
        OpenAIService.InterventionAnalysis analysis = smartSchedulerService.analyzeIntervention(
                description, interventionType, equipmentType);

        log.info("🤖 AI Analysis: Priority={}, Urgency={}",
                analysis.getPriority(), analysis.getUrgency());

        // 3. Create intervention linked to equipment
        Intervention intervention = Intervention.builder()
                .interventionId(UUID.randomUUID().toString())
                .title("Intervention - " + interventionType + " - " + equipment.getName())
                .description(description)
                .interventionType(interventionType)
                .equipmentId(equipmentId)
                .equipment(equipment)
                .priorityScore(analysis.getUrgency() * 10)
                .priority(smartSchedulerService.mapPriority(analysis.getPriority()))
                .status("PENDING")
                .build();

        intervention = interventionRepository.save(intervention);

        // 4. Update equipment status
        equipment.setStatus("PENDING");
        equipmentRepository.save(equipment);

        // 5. Try to automatically assign technician
        Technician bestTechnician = smartSchedulerService.findBestTechnician(intervention);

        if (bestTechnician != null) {
            log.info("✅ Auto-assigning technician: {}", bestTechnician.getName());

            intervention.setAssignedTechnicianId(bestTechnician.getTechnicianId());
            intervention.setStatus("IN_PROGRESS");

            bestTechnician.increaseWorkload();
            if (bestTechnician.getCurrentWorkload() >= 5) {
                bestTechnician.setAvailable(false);
            }

            interventionRepository.save(intervention);
            technicianRepository.save(bestTechnician);
            
            // ============ ADD NOTIFICATION TO TECHNICIAN ============
            Notification techNotification = Notification.builder()
                .id(UUID.randomUUID().toString())
                .title("New Assignment")
                .message("You have been assigned to intervention: " + intervention.getTitle())
                .type(Notification.NotificationType.SYSTEM)
                .recipientId(bestTechnician.getTechnicianId())  // Send to technician
                .timestamp(LocalDateTime.now())
                .build();
            notificationService.sendNotification(techNotification);
            log.info("📨 Auto-assignment notification sent to technician: {}", bestTechnician.getName());
            // ============ END NOTIFICATION ============
            
        } else {
            log.warn("⚠️ No technician available for auto-assignment");
        }

        // 6. Send notification to citizen
        String technicianInfo = bestTechnician != null ? bestTechnician.getName() : "Awaiting assignment";

        Notification notification = Notification.builder()
                .id(UUID.randomUUID().toString())
                .title("Intervention Created")
                .message("Intervention for " + equipment.getName() + " created. " +
                        "Priority: " + analysis.getPriority() + ". " +
                        "Technician: " + technicianInfo)
                .type(Notification.NotificationType.SYSTEM)
                .recipientId(citizenId)
                .timestamp(LocalDateTime.now())
                .build();
        notificationService.sendNotification(notification);

        log.info("✅ Intervention created: {}", intervention.getInterventionId());
        return intervention;
    }

    /**
     * Manually assign technician to intervention
     */
    public Map<String, Object> assignTechnician(String interventionId, String technicianId) {
        Map<String, Object> result = new HashMap<>();

        try {
            // Find intervention
            Intervention intervention = interventionRepository.findById(interventionId)
                    .orElseThrow(() -> new RuntimeException("Intervention not found: " + interventionId));

            // Find technician
            Technician technician = technicianRepository.findById(technicianId)
                    .orElseThrow(() -> new RuntimeException("Technician not found: " + technicianId));

            // Check if technician is available
            if (!technician.isAvailable()) {
                result.put("success", false);
                result.put("message", "Technician is not available");
                return result;
            }

            // Assign
            intervention.setAssignedTechnicianId(technicianId);
            intervention.setStatus("IN_PROGRESS");

            // Update workload
            technician.increaseWorkload();
            if (technician.getCurrentWorkload() >= 5) {
                technician.setAvailable(false);
            }

            // Save
            interventionRepository.save(intervention);
            technicianRepository.save(technician);

            // Update equipment status
            if (intervention.getEquipmentId() != null) {
                equipmentRepository.findById(intervention.getEquipmentId())
                        .ifPresent(equipment -> {
                            equipment.setStatus("PENDING");
                            equipmentRepository.save(equipment);
                        });
            }

            // Notifications
            Notification toTechnician = Notification.builder()
                    .id(UUID.randomUUID().toString())
                    .title("New Assignment")
                    .message("You have been assigned to intervention: " + intervention.getTitle())
                    .type(Notification.NotificationType.SYSTEM)
                    .recipientId(technicianId)
                    .timestamp(LocalDateTime.now())
                    .build();
            notificationService.sendNotification(toTechnician);

            result.put("success", true);
            result.put("message", "Technician assigned successfully");
            result.put("intervention", intervention);
            result.put("technician", technician);

        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Assignment failed: " + e.getMessage());
        }

        return result;
    }

    /**
     * Update intervention status
     */
    public Map<String, Object> updateStatus(String interventionId, String status, String citizenId) {
        Map<String, Object> result = new HashMap<>();

        try {
            Intervention intervention = interventionRepository.findById(interventionId)
                    .orElseThrow(() -> new RuntimeException("Intervention not found: " + interventionId));

            // Set status as String directly
            String oldStatus = intervention.getStatus();
            intervention.setStatus(status);

            // Handle completed/cancelled interventions
            if (status.equalsIgnoreCase("COMPLETED") || status.equalsIgnoreCase("CANCELLED")) {
                // Decrease technician workload if assigned
                if (intervention.getAssignedTechnicianId() != null) {
                    Technician technician = technicianRepository.findById(intervention.getAssignedTechnicianId())
                            .orElse(null);
                    if (technician != null) {
                        technician.decreaseWorkload();
                        if (technician.getCurrentWorkload() < 5) {
                            technician.setAvailable(true);
                        }
                        technicianRepository.save(technician);
                    }
                }

                // Update equipment status when intervention completed
                if (status.equalsIgnoreCase("COMPLETED") && intervention.getEquipmentId() != null) {
                    equipmentRepository.findById(intervention.getEquipmentId())
                            .ifPresent(equipment -> {
                                equipment.setStatus("ACTIVE"); // Reset to ACTIVE
                                equipment.setLastMaintenance(new java.util.Date()); // Update maintenance date
                                equipmentRepository.save(equipment);
                            });
                }

                intervention.setCompletedDate(LocalDateTime.now());
            }

            interventionRepository.save(intervention);

            // Send notification
            Notification notification = Notification.builder()
                    .id(UUID.randomUUID().toString())
                    .title("Intervention Status Updated")
                    .message("Intervention '" + intervention.getTitle() + "' status changed from " +
                            oldStatus + " to " + status)
                    .type(Notification.NotificationType.SYSTEM)
                    .recipientId(citizenId)
                    .timestamp(LocalDateTime.now())
                    .build();
            notificationService.sendNotification(notification);

            result.put("success", true);
            result.put("message", "Status updated successfully");
            result.put("intervention", intervention);

        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Status update failed: " + e.getMessage());
        }

        return result;
    }

    /**
     * Submit rating for completed intervention
     */
    public RatingResponseDTO submitRating(RatingRequestDTO ratingRequest, String citizenId) {
        try {
            log.info("📊 Submitting rating for intervention: {}", ratingRequest.getInterventionId());
            
            // 1. Find intervention
            Intervention intervention = interventionRepository.findById(ratingRequest.getInterventionId())
                    .orElseThrow(() -> new RuntimeException("Intervention not found"));
            
            // 2. Validate: Intervention must be COMPLETED
            if (!"COMPLETED".equalsIgnoreCase(intervention.getStatus())) {
                return RatingResponseDTO.builder()
                        .success(false)
                        .message("Can only rate COMPLETED interventions")
                        .interventionId(ratingRequest.getInterventionId())
                        .build();
            }
            
            // 3. Validate: Citizen must be the reporter
            if (!citizenId.equals(intervention.getCitizenId())) {
                return RatingResponseDTO.builder()
                        .success(false)
                        .message("Only the reporting citizen can rate this intervention")
                        .interventionId(ratingRequest.getInterventionId())
                        .build();
            }
            
            // 4. Update intervention with rating
            intervention.setRating(ratingRequest.getRating());
            intervention.setRatingComment(ratingRequest.getRatingComment());
            
            interventionRepository.save(intervention);
            
            // ============ ADD NOTIFICATION TO TECHNICIAN ============
            if (intervention.getAssignedTechnicianId() != null) {
                // Create star emojis for the notification
                String starEmojis = getStarEmojis(ratingRequest.getRating());
                
                Notification ratingNotification = Notification.builder()
                        .id(UUID.randomUUID().toString())
                        .title("New Rating Received")
                        .message("Your intervention '" + intervention.getTitle() + 
                                "' received " + starEmojis + " (" + ratingRequest.getRating() + "/5)" +
                                (ratingRequest.getRatingComment() != null && !ratingRequest.getRatingComment().isEmpty() ? 
                                "\nFeedback: \"" + ratingRequest.getRatingComment() + "\"" : ""))
                        .type(Notification.NotificationType.SYSTEM)
                        .recipientId(intervention.getAssignedTechnicianId())
                        .timestamp(LocalDateTime.now())
                        .build();
                notificationService.sendNotification(ratingNotification);
                
                log.info("📨 Rating notification sent to technician: {}", intervention.getAssignedTechnicianId());
            }
            // ============ END NOTIFICATION ============
            
            log.info("✅ Rating submitted: {} stars for intervention {}", 
                    ratingRequest.getRating(), intervention.getInterventionId());
            
            return RatingResponseDTO.builder()
                    .success(true)
                    .message("Rating submitted successfully")
                    .interventionId(intervention.getInterventionId())
                    .rating(ratingRequest.getRating())
                    .ratingComment(ratingRequest.getRatingComment())
                    .build();
                    
        } catch (Exception e) {
            log.error("❌ Error submitting rating: {}", e.getMessage());
            return RatingResponseDTO.builder()
                    .success(false)
                    .message("Error: " + e.getMessage())
                    .interventionId(ratingRequest.getInterventionId())
                    .build();
        }
    }
    
    /**
     * Helper method to generate star emojis for notifications
     */
    private String getStarEmojis(Double rating) {
        StringBuilder stars = new StringBuilder();
        int fullStars = rating.intValue();
        boolean hasHalfStar = rating % 1 >= 0.5;
        
        // Add full stars
        for (int i = 0; i < fullStars; i++) {
            stars.append("⭐");
        }
        
        // Add half star if needed
        if (hasHalfStar) {
            stars.append("✨");
        }
        
        // Add empty stars for remaining
        int remaining = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (int i = 0; i < remaining; i++) {
            stars.append("☆");
        }
        
        return stars.toString();
    }
}