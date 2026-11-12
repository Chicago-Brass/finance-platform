// Reviewed operating accounts. Dedicated Expense categories are excluded.
export const OPERATING_EXPENSE_ACCOUNTS = [
    "004.012",
    "004.013",
    "005.004",
    "005.301",
    "005.302",
    "006.001",
    "006.002",
    "006.003",
    "006.004",
    "007.001",
    "007.003",
    "007.004",
    "007.006",
    "007.007",
    "007.011",
    "007.012",
    "008.001",
    "008.002",
    "008.003",
    "008.004",
    "009.001",
    "009.002",
    "009.003",
    "009.004",
    "009.005",
    "009.006",
    "009.007",
    "009.008",
    "009.009",
    "009.010",
    "009.011",
    "009.012",
    "009.013",
    "009.102",
    "010.002",
    "525300",
    "922000"
];

// FIN uses six undotted digits for these two accounts; Supabase account codes use NNN.NNN.
export const OPERATING_EXPENSE_ACCOUNT_MAPPING: Record<string, string> = {
    "525300": "525.300",
    "922000": "922.000"
};
