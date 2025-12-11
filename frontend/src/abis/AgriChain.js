export const AgriChain = [
    "event PolicyCreated(uint256 policyId, address farmer, bytes32 indexId, uint256 threshold, uint256 premium)",
    "event PayoutExecuted(uint256 policyId, address farmer, uint256 amount)",
    "function createPolicy(bytes32 _indexId, uint256 _threshold, uint256 _startTimestamp, uint256 _endTimestamp) external payable",
    "function submitOracleReport(bytes32 _indexId, uint256 _rainfall, uint256 _timestamp, bytes memory _signature) external",
    "function allPolicies(uint256) view returns (address farmer, bytes32 indexId, uint256 threshold, uint256 startTimestamp, uint256 endTimestamp, uint256 premium, bool active, bool paidOut)"
];
