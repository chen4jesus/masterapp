package com.faithconnect.bookstacksync.model.validation;

import javax.validation.Constraint;
import javax.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Repeatable;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Validation annotation to validate that at least one of the specified fields is not null or empty.
 */
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = {RequireOneOfValidator.class})
@Repeatable(RequireOneOfs.class)
@Documented
public @interface RequireOneOf {
    
    String message() default "At least one of the fields must be provided";
    
    Class<?>[] groups() default {};
    
    Class<? extends Payload>[] payload() default {};
    
    /**
     * The fields to check, at least one of which must be non-null and non-empty.
     */
    String[] fields();
    
    /**
     * A descriptive name for the group of fields, used in the error message.
     */
    String fieldGroup() default "fields";
} 