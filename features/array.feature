Feature: Array Stuff
  As a user of ham-script
  I want to be able to use the awesome array features
  So that my code can stay simple

  Scenario: Simple Array Range
    Given `[1..3]`
    Then the result should be `[1, 2, 3]`

  Scenario: Negative Array Range
    Given `[-1..-5]`
    Then the result should be `[-1, -2, -3, -4, -5]`

  Scenario: Array Slices
    Given `[1..10][1:5]`
    Then the result should be `[2, 3, 4, 5]`

  Scenario: Array Steps
    Given `[1..10][::2]`
    Then the result should be `[1, 3, 5, 7, 9]`

  Scenario: Array Negative Step
    Given `[1..5][::-1]`
    Then the result should be `[5, 4, 3, 2, 1]`

  Scenario: List Comprehensions
    Given `[x*x | x <- [1..3]]`
    Then the result should be `[1, 4, 9]`