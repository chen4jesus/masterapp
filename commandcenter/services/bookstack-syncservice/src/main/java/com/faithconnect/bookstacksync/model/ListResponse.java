package com.faithconnect.bookstacksync.model;

import lombok.Data;

import java.util.List;

@Data
public class ListResponse<T> {
    private List<T> data;
    private Integer total;
} 