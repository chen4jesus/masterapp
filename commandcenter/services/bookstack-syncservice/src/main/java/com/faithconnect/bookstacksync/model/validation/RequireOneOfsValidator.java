package com.faithconnect.bookstacksync.model.validation;

import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;

/**
 * Validator for the {@link RequireOneOfs} annotation.
 * This validator delegates to the {@link RequireOneOfValidator} for each {@link RequireOneOf} annotation.
 */
public class RequireOneOfsValidator implements ConstraintValidator<RequireOneOfs, Object> {
    
    private RequireOneOf[] requireOneOfs;
    
    @Override
    public void initialize(RequireOneOfs constraintAnnotation) {
        this.requireOneOfs = constraintAnnotation.value();
    }
    
    @Override
    public boolean isValid(Object object, ConstraintValidatorContext context) {
        // Delegate to RequireOneOfValidator for each RequireOneOf annotation
        RequireOneOfValidator validator = new RequireOneOfValidator();
        
        // Disable the default constraint violation to avoid duplicate messages
        context.disableDefaultConstraintViolation();
        
        boolean isValid = true;
        
        for (RequireOneOf requireOneOf : requireOneOfs) {
            validator.initialize(requireOneOf);
            if (!validator.isValid(object, context)) {
                isValid = false;
            }
        }
        
        return isValid;
    }
} 