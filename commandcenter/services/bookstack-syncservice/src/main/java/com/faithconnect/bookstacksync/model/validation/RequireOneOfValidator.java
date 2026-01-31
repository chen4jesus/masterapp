package com.faithconnect.bookstacksync.model.validation;

import org.springframework.beans.BeanWrapperImpl;

import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;
import java.util.Arrays;

/**
 * Validator for the {@link RequireOneOf} annotation.
 */
public class RequireOneOfValidator implements ConstraintValidator<RequireOneOf, Object> {
    
    private String[] fields;
    private String fieldGroup;
    private String message;
    
    @Override
    public void initialize(RequireOneOf constraintAnnotation) {
        this.fields = constraintAnnotation.fields();
        this.fieldGroup = constraintAnnotation.fieldGroup();
        this.message = constraintAnnotation.message();
    }
    
    @Override
    public boolean isValid(Object object, ConstraintValidatorContext context) {
        if (object == null) {
            return true; // Null objects are validated by @NotNull
        }
        
        BeanWrapperImpl beanWrapper = new BeanWrapperImpl(object);
        
        // Check if at least one of the fields is non-null and non-empty
        boolean isValid = Arrays.stream(fields)
                .map(field -> {
                    Object fieldValue = beanWrapper.getPropertyValue(field);
                    if (fieldValue == null) {
                        return false;
                    }
                    if (fieldValue instanceof String) {
                        return !((String) fieldValue).isEmpty();
                    }
                    return true; // Non-string values are considered valid if non-null
                })
                .anyMatch(valid -> valid);
        
        if (!isValid) {
            // Customize the error message
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                    "At least one of the " + fieldGroup + " must be provided: " + String.join(", ", fields))
                    .addConstraintViolation();
        }
        
        return isValid;
    }
} 