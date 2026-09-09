import type { Difficulty, DsaProblem } from "@/lib/types";

type Level = "E" | "M" | "H";
const LEVEL: Record<Level, Difficulty> = { E: "EASY", M: "MEDIUM", H: "HARD" };

/**
 * The NeetCode 150, in the order the list teaches it. Patterns build on each
 * other, which is why the plan works through them top to bottom.
 */
const LIST: [pattern: string, problems: [title: string, level: Level][]][] = [
  [
    "Arrays and Hashing",
    [
      ["Contains Duplicate", "E"],
      ["Valid Anagram", "E"],
      ["Two Sum", "E"],
      ["Group Anagrams", "M"],
      ["Top K Frequent Elements", "M"],
      ["Encode and Decode Strings", "M"],
      ["Product of Array Except Self", "M"],
      ["Valid Sudoku", "M"],
      ["Longest Consecutive Sequence", "M"],
    ],
  ],
  [
    "Two Pointers",
    [
      ["Valid Palindrome", "E"],
      ["Two Sum II", "M"],
      ["3Sum", "M"],
      ["Container With Most Water", "M"],
      ["Trapping Rain Water", "H"],
    ],
  ],
  [
    "Sliding Window",
    [
      ["Best Time to Buy and Sell Stock", "E"],
      ["Longest Substring Without Repeating Characters", "M"],
      ["Longest Repeating Character Replacement", "M"],
      ["Permutation in String", "M"],
      ["Minimum Window Substring", "H"],
      ["Sliding Window Maximum", "H"],
    ],
  ],
  [
    "Stack",
    [
      ["Valid Parentheses", "E"],
      ["Min Stack", "M"],
      ["Evaluate Reverse Polish Notation", "M"],
      ["Generate Parentheses", "M"],
      ["Daily Temperatures", "M"],
      ["Car Fleet", "M"],
      ["Largest Rectangle in Histogram", "H"],
    ],
  ],
  [
    "Binary Search",
    [
      ["Binary Search", "E"],
      ["Search a 2D Matrix", "M"],
      ["Koko Eating Bananas", "M"],
      ["Find Minimum in Rotated Sorted Array", "M"],
      ["Search in Rotated Sorted Array", "M"],
      ["Time Based Key-Value Store", "M"],
      ["Median of Two Sorted Arrays", "H"],
    ],
  ],
  [
    "Linked List",
    [
      ["Reverse Linked List", "E"],
      ["Merge Two Sorted Lists", "E"],
      ["Reorder List", "M"],
      ["Remove Nth Node From End of List", "M"],
      ["Copy List with Random Pointer", "M"],
      ["Add Two Numbers", "M"],
      ["Linked List Cycle", "E"],
      ["Find the Duplicate Number", "M"],
      ["LRU Cache", "M"],
      ["Merge K Sorted Lists", "H"],
      ["Reverse Nodes in K-Group", "H"],
    ],
  ],
  [
    "Trees",
    [
      ["Invert Binary Tree", "E"],
      ["Maximum Depth of Binary Tree", "E"],
      ["Diameter of Binary Tree", "E"],
      ["Balanced Binary Tree", "E"],
      ["Same Tree", "E"],
      ["Subtree of Another Tree", "E"],
      ["Lowest Common Ancestor of a BST", "M"],
      ["Binary Tree Level Order Traversal", "M"],
      ["Binary Tree Right Side View", "M"],
      ["Count Good Nodes in Binary Tree", "M"],
      ["Validate Binary Search Tree", "M"],
      ["Kth Smallest Element in a BST", "M"],
      ["Construct Binary Tree from Preorder and Inorder Traversal", "M"],
      ["Binary Tree Maximum Path Sum", "H"],
      ["Serialize and Deserialize Binary Tree", "H"],
    ],
  ],
  [
    "Tries",
    [
      ["Implement Trie", "M"],
      ["Design Add and Search Words Data Structure", "M"],
      ["Word Search II", "H"],
    ],
  ],
  [
    "Heap",
    [
      ["Kth Largest Element in a Stream", "E"],
      ["Last Stone Weight", "E"],
      ["K Closest Points to Origin", "M"],
      ["Kth Largest Element in an Array", "M"],
      ["Task Scheduler", "M"],
      ["Design Twitter", "M"],
      ["Find Median from Data Stream", "H"],
    ],
  ],
  [
    "Backtracking",
    [
      ["Subsets", "M"],
      ["Combination Sum", "M"],
      ["Permutations", "M"],
      ["Subsets II", "M"],
      ["Combination Sum II", "M"],
      ["Word Search", "M"],
      ["Palindrome Partitioning", "M"],
      ["Letter Combinations of a Phone Number", "M"],
      ["N-Queens", "H"],
    ],
  ],
  [
    "Graphs",
    [
      ["Number of Islands", "M"],
      ["Max Area of Island", "M"],
      ["Clone Graph", "M"],
      ["Walls and Gates", "M"],
      ["Rotting Oranges", "M"],
      ["Pacific Atlantic Water Flow", "M"],
      ["Surrounded Regions", "M"],
      ["Course Schedule", "M"],
      ["Course Schedule II", "M"],
      ["Graph Valid Tree", "M"],
      ["Number of Connected Components in an Undirected Graph", "M"],
      ["Redundant Connection", "M"],
      ["Word Ladder", "H"],
    ],
  ],
  [
    "Advanced Graphs",
    [
      ["Reconstruct Itinerary", "H"],
      ["Min Cost to Connect All Points", "M"],
      ["Network Delay Time", "M"],
      ["Swim in Rising Water", "H"],
      ["Alien Dictionary", "H"],
      ["Cheapest Flights Within K Stops", "M"],
    ],
  ],
  [
    "1-D Dynamic Programming",
    [
      ["Climbing Stairs", "E"],
      ["Min Cost Climbing Stairs", "E"],
      ["House Robber", "M"],
      ["House Robber II", "M"],
      ["Longest Palindromic Substring", "M"],
      ["Palindromic Substrings", "M"],
      ["Decode Ways", "M"],
      ["Coin Change", "M"],
      ["Maximum Product Subarray", "M"],
      ["Word Break", "M"],
      ["Longest Increasing Subsequence", "M"],
      ["Partition Equal Subset Sum", "M"],
    ],
  ],
  [
    "2-D Dynamic Programming",
    [
      ["Unique Paths", "M"],
      ["Longest Common Subsequence", "M"],
      ["Best Time to Buy and Sell Stock with Cooldown", "M"],
      ["Coin Change II", "M"],
      ["Target Sum", "M"],
      ["Interleaving String", "M"],
      ["Longest Increasing Path in a Matrix", "H"],
      ["Distinct Subsequences", "H"],
      ["Edit Distance", "M"],
      ["Burst Balloons", "H"],
      ["Regular Expression Matching", "H"],
    ],
  ],
  [
    "Greedy",
    [
      ["Maximum Subarray", "M"],
      ["Jump Game", "M"],
      ["Jump Game II", "M"],
      ["Gas Station", "M"],
      ["Hand of Straights", "M"],
      ["Merge Triplets to Form Target Triplet", "M"],
      ["Partition Labels", "M"],
      ["Valid Parenthesis String", "M"],
    ],
  ],
  [
    "Intervals",
    [
      ["Insert Interval", "M"],
      ["Merge Intervals", "M"],
      ["Non-overlapping Intervals", "M"],
      ["Meeting Rooms", "E"],
      ["Meeting Rooms II", "M"],
      ["Minimum Interval to Include Each Query", "H"],
    ],
  ],
  [
    "Math and Geometry",
    [
      ["Rotate Image", "M"],
      ["Spiral Matrix", "M"],
      ["Set Matrix Zeroes", "M"],
      ["Happy Number", "E"],
      ["Plus One", "E"],
      ["Pow(x, n)", "M"],
      ["Multiply Strings", "M"],
      ["Detect Squares", "M"],
    ],
  ],
  [
    "Bit Manipulation",
    [
      ["Single Number", "E"],
      ["Number of 1 Bits", "E"],
      ["Counting Bits", "E"],
      ["Reverse Bits", "E"],
      ["Missing Number", "E"],
      ["Sum of Two Integers", "M"],
      ["Reverse Integer", "M"],
    ],
  ],
];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** 150 problems, none solved. Solves are recorded against the id. */
export function neetcode150(): DsaProblem[] {
  const out: DsaProblem[] = [];
  LIST.forEach(([pattern, problems]) => {
    problems.forEach(([title, level]) => {
      out.push({
        id: `nc-${slugify(title)}`,
        slug: slugify(title),
        title,
        pattern,
        level: LEVEL[level],
        solvedAt: null,
      });
    });
  });
  return out;
}

export const NEETCODE_PATTERNS = LIST.map(([pattern]) => pattern);
