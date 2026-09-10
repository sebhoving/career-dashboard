-- Reference data for the dashboard: the roadmap milestones, the degree
-- modules and the NeetCode 150.
--
-- Run this AFTER schema.sql, and after you have signed in at least once.
-- The first account to sign in is created ADMIN automatically, so there is
-- nothing to promote by hand.
--
-- It seeds every ADMIN profile, and it is safe to run more than once.
-- Milestones and problems that already exist are left exactly as they are,
-- so your ticked problems survive a re-run. Modules carry no progress, so
-- they are refreshed to match this file.
--
-- Nothing here represents progress. Every milestone starts at 0 and every
-- problem starts unsolved.

do $seed$
declare
  target uuid;
  seeded int := 0;
begin
  -- Module credits are ECTS, and the old smallint column would silently round
  -- 7.5 to 8. schema.sql widens it, so stop here if that has not been re-run.
  if (select data_type from information_schema.columns
      where table_schema = 'public' and table_name = 'modules' and column_name = 'credits')
     is distinct from 'numeric' then
    raise exception using
      message = 'The modules table still has whole-number credits and no academic year.',
      hint    = 'Run supabase/schema.sql again, then this file.';
  end if;

  for target in select id from profiles where role = 'ADMIN' loop
    seeded := seeded + 1;

    -- ---------------------------------------------------------- milestones
    insert into milestones (user_id, key, title, category, phase, start_date, end_date, progress)
    select target, v.mkey, v.title, v.category::task_category, v.phase, v.start_date::date, v.end_date::date, 0
    from (values
    ('m1', 'NeetCode 150', 'DSA', '2026 · Foundations', '2026-09-14', '2027-05-31'),
    ('m2', 'Maths refresh: linear algebra, probability', 'PHYSICS', '2026 · Foundations', '2026-09-14', '2026-11-15'),
    ('m3', 'PyTorch foundations', 'PYTORCH', '2026 · Foundations', '2026-10-01', '2026-12-20'),
    ('m4', 'Summer 2027 internship applications', 'CAREER', '2026 · Foundations', '2026-10-01', '2027-01-31'),
    ('m5', 'Autograd and a transformer from scratch', 'PYTORCH', '2027 · Depth', '2027-01-10', '2027-03-31'),
    ('m6', 'Paper reproduction and reading', 'PYTORCH', '2027 · Depth', '2027-03-01', '2027-06-30'),
    ('m9', 'Modules with direct transfer: optimisation, RL, stat mech', 'PHYSICS', '2027 · Depth', '2027-01-10', '2028-03-31'),
    ('m7', 'Research internship', 'CAREER', '2027 · Research', '2027-07-01', '2027-09-15'),
    ('m8', 'Efficient inference project', 'PYTORCH', '2027 · Research', '2027-10-01', '2027-12-15'),
    ('m10', 'Masters thesis', 'PHYSICS', '2028 · Conversion', '2028-01-08', '2028-06-20'),
    ('m11', 'Applied Scientist applications and interviews', 'CAREER', '2028 · Conversion', '2028-01-15', '2028-08-30')
    ) as v(mkey, title, category, phase, start_date, end_date)
    on conflict (user_id, key) do nothing;

    -- ------------------------------------------------------------- modules
    --
    -- The 2026-27 allocation from the electives algorithm. Unlike the rest of
    -- this file, a re-run refreshes these rows: nothing is ticked on a module,
    -- so there is no progress to protect.
    --
    -- The delete clears the placeholders seeded before the allocation came
    -- out. Placeholders have no academic year, so it skips any row that does.
    -- PHYS60004 was a placeholder too, under the wrong title; the upsert
    -- corrects it in place.
    delete from modules
    where user_id = target
      and academic_year is null
      and code in ('MATH70027', 'PHYS70012', 'COMP70050', 'PHYS60011', 'COMP70028');

    insert into modules (user_id, code, title, academic_year, term, credits, relevance, carry_over)
    select target, v.code, v.title, '2026-27', v.term, v.credits, v.relevance, v.carry_over
    from (values
    ('PHYS60012', 'Computational Physics', 'Term 1', 7.5, 4, 'Numerical stability, vectorised simulation, profiling'),
    ('PHYS60023', 'Self-Study Project (Term 2)', 'Term 2', 7.5, 4, 'Depends on the topic: aim it at ML if you get to choose'),
    ('PHYS60008', 'Principles of Instrumentation', 'Term 2', 7.5, 3, 'Signals, noise, sampling: Fourier intuition for convolutions'),
    ('PHYS60004', 'Lab (Term 2)', 'Term 2', 7.5, 3, 'Experiment design, error bars, write-ups: how ablations are run'),
    ('PHYS60003', 'Solid State Physics', 'Term 1', 7.5, 2, 'Reciprocal space, eigenproblems, a route into ML for materials'),
    ('PHYS60001', 'Nuclear and Particle Physics', 'Term 2', 7.5, 2, 'Symmetries and conservation laws, the idea behind equivariant networks'),
    ('PHYS60006', 'Lasers', 'Term 1', 5, 1, 'Little direct transfer'),
    ('PHYS60002', 'Comprehensive', 'Terms 1 and 2', 10, 1, 'Breadth across core physics, little direct transfer')
    ) as v(code, title, term, credits, relevance, carry_over)
    on conflict (user_id, code) do update set
      title         = excluded.title,
      academic_year = excluded.academic_year,
      term          = excluded.term,
      credits       = excluded.credits,
      relevance     = excluded.relevance,
      carry_over    = excluded.carry_over;

    -- -------------------------------------------------- NeetCode 150, unsolved
    insert into dsa_problems (user_id, slug, title, pattern, level, position, solved_at)
    select target, v.slug, v.title, v.pattern, v.level::difficulty, v.ord, null
    from (values
    ('contains-duplicate', 'Contains Duplicate', 'Arrays and Hashing', 'EASY', 1),
    ('valid-anagram', 'Valid Anagram', 'Arrays and Hashing', 'EASY', 2),
    ('two-sum', 'Two Sum', 'Arrays and Hashing', 'EASY', 3),
    ('group-anagrams', 'Group Anagrams', 'Arrays and Hashing', 'MEDIUM', 4),
    ('top-k-frequent-elements', 'Top K Frequent Elements', 'Arrays and Hashing', 'MEDIUM', 5),
    ('encode-and-decode-strings', 'Encode and Decode Strings', 'Arrays and Hashing', 'MEDIUM', 6),
    ('product-of-array-except-self', 'Product of Array Except Self', 'Arrays and Hashing', 'MEDIUM', 7),
    ('valid-sudoku', 'Valid Sudoku', 'Arrays and Hashing', 'MEDIUM', 8),
    ('longest-consecutive-sequence', 'Longest Consecutive Sequence', 'Arrays and Hashing', 'MEDIUM', 9),
    ('valid-palindrome', 'Valid Palindrome', 'Two Pointers', 'EASY', 10),
    ('two-sum-ii', 'Two Sum II', 'Two Pointers', 'MEDIUM', 11),
    ('3sum', '3Sum', 'Two Pointers', 'MEDIUM', 12),
    ('container-with-most-water', 'Container With Most Water', 'Two Pointers', 'MEDIUM', 13),
    ('trapping-rain-water', 'Trapping Rain Water', 'Two Pointers', 'HARD', 14),
    ('best-time-to-buy-and-sell-stock', 'Best Time to Buy and Sell Stock', 'Sliding Window', 'EASY', 15),
    ('longest-substring-without-repeating-characters', 'Longest Substring Without Repeating Characters', 'Sliding Window', 'MEDIUM', 16),
    ('longest-repeating-character-replacement', 'Longest Repeating Character Replacement', 'Sliding Window', 'MEDIUM', 17),
    ('permutation-in-string', 'Permutation in String', 'Sliding Window', 'MEDIUM', 18),
    ('minimum-window-substring', 'Minimum Window Substring', 'Sliding Window', 'HARD', 19),
    ('sliding-window-maximum', 'Sliding Window Maximum', 'Sliding Window', 'HARD', 20),
    ('valid-parentheses', 'Valid Parentheses', 'Stack', 'EASY', 21),
    ('min-stack', 'Min Stack', 'Stack', 'MEDIUM', 22),
    ('evaluate-reverse-polish-notation', 'Evaluate Reverse Polish Notation', 'Stack', 'MEDIUM', 23),
    ('generate-parentheses', 'Generate Parentheses', 'Stack', 'MEDIUM', 24),
    ('daily-temperatures', 'Daily Temperatures', 'Stack', 'MEDIUM', 25),
    ('car-fleet', 'Car Fleet', 'Stack', 'MEDIUM', 26),
    ('largest-rectangle-in-histogram', 'Largest Rectangle in Histogram', 'Stack', 'HARD', 27),
    ('binary-search', 'Binary Search', 'Binary Search', 'EASY', 28),
    ('search-a-2d-matrix', 'Search a 2D Matrix', 'Binary Search', 'MEDIUM', 29),
    ('koko-eating-bananas', 'Koko Eating Bananas', 'Binary Search', 'MEDIUM', 30),
    ('find-minimum-in-rotated-sorted-array', 'Find Minimum in Rotated Sorted Array', 'Binary Search', 'MEDIUM', 31),
    ('search-in-rotated-sorted-array', 'Search in Rotated Sorted Array', 'Binary Search', 'MEDIUM', 32),
    ('time-based-key-value-store', 'Time Based Key-Value Store', 'Binary Search', 'MEDIUM', 33),
    ('median-of-two-sorted-arrays', 'Median of Two Sorted Arrays', 'Binary Search', 'HARD', 34),
    ('reverse-linked-list', 'Reverse Linked List', 'Linked List', 'EASY', 35),
    ('merge-two-sorted-lists', 'Merge Two Sorted Lists', 'Linked List', 'EASY', 36),
    ('reorder-list', 'Reorder List', 'Linked List', 'MEDIUM', 37),
    ('remove-nth-node-from-end-of-list', 'Remove Nth Node From End of List', 'Linked List', 'MEDIUM', 38),
    ('copy-list-with-random-pointer', 'Copy List with Random Pointer', 'Linked List', 'MEDIUM', 39),
    ('add-two-numbers', 'Add Two Numbers', 'Linked List', 'MEDIUM', 40),
    ('linked-list-cycle', 'Linked List Cycle', 'Linked List', 'EASY', 41),
    ('find-the-duplicate-number', 'Find the Duplicate Number', 'Linked List', 'MEDIUM', 42),
    ('lru-cache', 'LRU Cache', 'Linked List', 'MEDIUM', 43),
    ('merge-k-sorted-lists', 'Merge K Sorted Lists', 'Linked List', 'HARD', 44),
    ('reverse-nodes-in-k-group', 'Reverse Nodes in K-Group', 'Linked List', 'HARD', 45),
    ('invert-binary-tree', 'Invert Binary Tree', 'Trees', 'EASY', 46),
    ('maximum-depth-of-binary-tree', 'Maximum Depth of Binary Tree', 'Trees', 'EASY', 47),
    ('diameter-of-binary-tree', 'Diameter of Binary Tree', 'Trees', 'EASY', 48),
    ('balanced-binary-tree', 'Balanced Binary Tree', 'Trees', 'EASY', 49),
    ('same-tree', 'Same Tree', 'Trees', 'EASY', 50),
    ('subtree-of-another-tree', 'Subtree of Another Tree', 'Trees', 'EASY', 51),
    ('lowest-common-ancestor-of-a-bst', 'Lowest Common Ancestor of a BST', 'Trees', 'MEDIUM', 52),
    ('binary-tree-level-order-traversal', 'Binary Tree Level Order Traversal', 'Trees', 'MEDIUM', 53),
    ('binary-tree-right-side-view', 'Binary Tree Right Side View', 'Trees', 'MEDIUM', 54),
    ('count-good-nodes-in-binary-tree', 'Count Good Nodes in Binary Tree', 'Trees', 'MEDIUM', 55),
    ('validate-binary-search-tree', 'Validate Binary Search Tree', 'Trees', 'MEDIUM', 56),
    ('kth-smallest-element-in-a-bst', 'Kth Smallest Element in a BST', 'Trees', 'MEDIUM', 57),
    ('construct-binary-tree-from-preorder-and-inorder-traversal', 'Construct Binary Tree from Preorder and Inorder Traversal', 'Trees', 'MEDIUM', 58),
    ('binary-tree-maximum-path-sum', 'Binary Tree Maximum Path Sum', 'Trees', 'HARD', 59),
    ('serialize-and-deserialize-binary-tree', 'Serialize and Deserialize Binary Tree', 'Trees', 'HARD', 60),
    ('implement-trie', 'Implement Trie', 'Tries', 'MEDIUM', 61),
    ('design-add-and-search-words-data-structure', 'Design Add and Search Words Data Structure', 'Tries', 'MEDIUM', 62),
    ('word-search-ii', 'Word Search II', 'Tries', 'HARD', 63),
    ('kth-largest-element-in-a-stream', 'Kth Largest Element in a Stream', 'Heap', 'EASY', 64),
    ('last-stone-weight', 'Last Stone Weight', 'Heap', 'EASY', 65),
    ('k-closest-points-to-origin', 'K Closest Points to Origin', 'Heap', 'MEDIUM', 66),
    ('kth-largest-element-in-an-array', 'Kth Largest Element in an Array', 'Heap', 'MEDIUM', 67),
    ('task-scheduler', 'Task Scheduler', 'Heap', 'MEDIUM', 68),
    ('design-twitter', 'Design Twitter', 'Heap', 'MEDIUM', 69),
    ('find-median-from-data-stream', 'Find Median from Data Stream', 'Heap', 'HARD', 70),
    ('subsets', 'Subsets', 'Backtracking', 'MEDIUM', 71),
    ('combination-sum', 'Combination Sum', 'Backtracking', 'MEDIUM', 72),
    ('permutations', 'Permutations', 'Backtracking', 'MEDIUM', 73),
    ('subsets-ii', 'Subsets II', 'Backtracking', 'MEDIUM', 74),
    ('combination-sum-ii', 'Combination Sum II', 'Backtracking', 'MEDIUM', 75),
    ('word-search', 'Word Search', 'Backtracking', 'MEDIUM', 76),
    ('palindrome-partitioning', 'Palindrome Partitioning', 'Backtracking', 'MEDIUM', 77),
    ('letter-combinations-of-a-phone-number', 'Letter Combinations of a Phone Number', 'Backtracking', 'MEDIUM', 78),
    ('n-queens', 'N-Queens', 'Backtracking', 'HARD', 79),
    ('number-of-islands', 'Number of Islands', 'Graphs', 'MEDIUM', 80),
    ('max-area-of-island', 'Max Area of Island', 'Graphs', 'MEDIUM', 81),
    ('clone-graph', 'Clone Graph', 'Graphs', 'MEDIUM', 82),
    ('walls-and-gates', 'Walls and Gates', 'Graphs', 'MEDIUM', 83),
    ('rotting-oranges', 'Rotting Oranges', 'Graphs', 'MEDIUM', 84),
    ('pacific-atlantic-water-flow', 'Pacific Atlantic Water Flow', 'Graphs', 'MEDIUM', 85),
    ('surrounded-regions', 'Surrounded Regions', 'Graphs', 'MEDIUM', 86),
    ('course-schedule', 'Course Schedule', 'Graphs', 'MEDIUM', 87),
    ('course-schedule-ii', 'Course Schedule II', 'Graphs', 'MEDIUM', 88),
    ('graph-valid-tree', 'Graph Valid Tree', 'Graphs', 'MEDIUM', 89),
    ('number-of-connected-components-in-an-undirected-graph', 'Number of Connected Components in an Undirected Graph', 'Graphs', 'MEDIUM', 90),
    ('redundant-connection', 'Redundant Connection', 'Graphs', 'MEDIUM', 91),
    ('word-ladder', 'Word Ladder', 'Graphs', 'HARD', 92),
    ('reconstruct-itinerary', 'Reconstruct Itinerary', 'Advanced Graphs', 'HARD', 93),
    ('min-cost-to-connect-all-points', 'Min Cost to Connect All Points', 'Advanced Graphs', 'MEDIUM', 94),
    ('network-delay-time', 'Network Delay Time', 'Advanced Graphs', 'MEDIUM', 95),
    ('swim-in-rising-water', 'Swim in Rising Water', 'Advanced Graphs', 'HARD', 96),
    ('alien-dictionary', 'Alien Dictionary', 'Advanced Graphs', 'HARD', 97),
    ('cheapest-flights-within-k-stops', 'Cheapest Flights Within K Stops', 'Advanced Graphs', 'MEDIUM', 98),
    ('climbing-stairs', 'Climbing Stairs', '1-D Dynamic Programming', 'EASY', 99),
    ('min-cost-climbing-stairs', 'Min Cost Climbing Stairs', '1-D Dynamic Programming', 'EASY', 100),
    ('house-robber', 'House Robber', '1-D Dynamic Programming', 'MEDIUM', 101),
    ('house-robber-ii', 'House Robber II', '1-D Dynamic Programming', 'MEDIUM', 102),
    ('longest-palindromic-substring', 'Longest Palindromic Substring', '1-D Dynamic Programming', 'MEDIUM', 103),
    ('palindromic-substrings', 'Palindromic Substrings', '1-D Dynamic Programming', 'MEDIUM', 104),
    ('decode-ways', 'Decode Ways', '1-D Dynamic Programming', 'MEDIUM', 105),
    ('coin-change', 'Coin Change', '1-D Dynamic Programming', 'MEDIUM', 106),
    ('maximum-product-subarray', 'Maximum Product Subarray', '1-D Dynamic Programming', 'MEDIUM', 107),
    ('word-break', 'Word Break', '1-D Dynamic Programming', 'MEDIUM', 108),
    ('longest-increasing-subsequence', 'Longest Increasing Subsequence', '1-D Dynamic Programming', 'MEDIUM', 109),
    ('partition-equal-subset-sum', 'Partition Equal Subset Sum', '1-D Dynamic Programming', 'MEDIUM', 110),
    ('unique-paths', 'Unique Paths', '2-D Dynamic Programming', 'MEDIUM', 111),
    ('longest-common-subsequence', 'Longest Common Subsequence', '2-D Dynamic Programming', 'MEDIUM', 112),
    ('best-time-to-buy-and-sell-stock-with-cooldown', 'Best Time to Buy and Sell Stock with Cooldown', '2-D Dynamic Programming', 'MEDIUM', 113),
    ('coin-change-ii', 'Coin Change II', '2-D Dynamic Programming', 'MEDIUM', 114),
    ('target-sum', 'Target Sum', '2-D Dynamic Programming', 'MEDIUM', 115),
    ('interleaving-string', 'Interleaving String', '2-D Dynamic Programming', 'MEDIUM', 116),
    ('longest-increasing-path-in-a-matrix', 'Longest Increasing Path in a Matrix', '2-D Dynamic Programming', 'HARD', 117),
    ('distinct-subsequences', 'Distinct Subsequences', '2-D Dynamic Programming', 'HARD', 118),
    ('edit-distance', 'Edit Distance', '2-D Dynamic Programming', 'MEDIUM', 119),
    ('burst-balloons', 'Burst Balloons', '2-D Dynamic Programming', 'HARD', 120),
    ('regular-expression-matching', 'Regular Expression Matching', '2-D Dynamic Programming', 'HARD', 121),
    ('maximum-subarray', 'Maximum Subarray', 'Greedy', 'MEDIUM', 122),
    ('jump-game', 'Jump Game', 'Greedy', 'MEDIUM', 123),
    ('jump-game-ii', 'Jump Game II', 'Greedy', 'MEDIUM', 124),
    ('gas-station', 'Gas Station', 'Greedy', 'MEDIUM', 125),
    ('hand-of-straights', 'Hand of Straights', 'Greedy', 'MEDIUM', 126),
    ('merge-triplets-to-form-target-triplet', 'Merge Triplets to Form Target Triplet', 'Greedy', 'MEDIUM', 127),
    ('partition-labels', 'Partition Labels', 'Greedy', 'MEDIUM', 128),
    ('valid-parenthesis-string', 'Valid Parenthesis String', 'Greedy', 'MEDIUM', 129),
    ('insert-interval', 'Insert Interval', 'Intervals', 'MEDIUM', 130),
    ('merge-intervals', 'Merge Intervals', 'Intervals', 'MEDIUM', 131),
    ('non-overlapping-intervals', 'Non-overlapping Intervals', 'Intervals', 'MEDIUM', 132),
    ('meeting-rooms', 'Meeting Rooms', 'Intervals', 'EASY', 133),
    ('meeting-rooms-ii', 'Meeting Rooms II', 'Intervals', 'MEDIUM', 134),
    ('minimum-interval-to-include-each-query', 'Minimum Interval to Include Each Query', 'Intervals', 'HARD', 135),
    ('rotate-image', 'Rotate Image', 'Math and Geometry', 'MEDIUM', 136),
    ('spiral-matrix', 'Spiral Matrix', 'Math and Geometry', 'MEDIUM', 137),
    ('set-matrix-zeroes', 'Set Matrix Zeroes', 'Math and Geometry', 'MEDIUM', 138),
    ('happy-number', 'Happy Number', 'Math and Geometry', 'EASY', 139),
    ('plus-one', 'Plus One', 'Math and Geometry', 'EASY', 140),
    ('pow-x-n', 'Pow(x, n)', 'Math and Geometry', 'MEDIUM', 141),
    ('multiply-strings', 'Multiply Strings', 'Math and Geometry', 'MEDIUM', 142),
    ('detect-squares', 'Detect Squares', 'Math and Geometry', 'MEDIUM', 143),
    ('single-number', 'Single Number', 'Bit Manipulation', 'EASY', 144),
    ('number-of-1-bits', 'Number of 1 Bits', 'Bit Manipulation', 'EASY', 145),
    ('counting-bits', 'Counting Bits', 'Bit Manipulation', 'EASY', 146),
    ('reverse-bits', 'Reverse Bits', 'Bit Manipulation', 'EASY', 147),
    ('missing-number', 'Missing Number', 'Bit Manipulation', 'EASY', 148),
    ('sum-of-two-integers', 'Sum of Two Integers', 'Bit Manipulation', 'MEDIUM', 149),
    ('reverse-integer', 'Reverse Integer', 'Bit Manipulation', 'MEDIUM', 150)
    ) as v(slug, title, pattern, level, ord)
    on conflict (user_id, slug) do nothing;
  end loop;

  if seeded = 0 then
    raise exception using
      message = 'No ADMIN profile found, so nothing was seeded.',
      hint    = 'Sign in to the app once (the first account becomes ADMIN), then run this file again.';
  end if;

  raise notice 'Seeded reference data for % admin profile(s).', seeded;
end
$seed$;
