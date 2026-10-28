package com.hospital.consent.service;

import com.hospital.consent.dto.department.DepartmentDto;
import com.hospital.consent.entity.Department;
import com.hospital.consent.exception.DuplicateResourceException;
import com.hospital.consent.exception.ResourceNotFoundException;
import com.hospital.consent.repository.DepartmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentService(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    @Transactional(readOnly = true)
    public List<DepartmentDto> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DepartmentDto getDepartmentById(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + id));
        return mapToDto(department);
    }

    @Transactional
    public DepartmentDto createDepartment(DepartmentDto dto) {
        if (departmentRepository.existsByNameIgnoreCase(dto.getName())) {
            throw new DuplicateResourceException("Department with name '" + dto.getName() + "' already exists");
        }
        Department department = new Department(
                dto.getName().trim(),
                dto.getDescription(),
                dto.getHeadDoctorName()
        );
        department = departmentRepository.save(department);
        return mapToDto(department);
    }

    @Transactional
    public DepartmentDto updateDepartment(Long id, DepartmentDto dto) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + id));

        if (!department.getName().equalsIgnoreCase(dto.getName()) &&
                departmentRepository.existsByNameIgnoreCase(dto.getName())) {
            throw new DuplicateResourceException("Department with name '" + dto.getName() + "' already exists");
        }

        department.setName(dto.getName().trim());
        department.setDescription(dto.getDescription());
        department.setHeadDoctorName(dto.getHeadDoctorName());

        department = departmentRepository.save(department);
        return mapToDto(department);
    }

    @Transactional
    public void deleteDepartment(Long id) {
        if (!departmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Department not found with ID: " + id);
        }
        departmentRepository.deleteById(id);
    }

    private DepartmentDto mapToDto(Department dept) {
        return new DepartmentDto(
                dept.getId(),
                dept.getName(),
                dept.getDescription(),
                dept.getHeadDoctorName()
        );
    }
}
