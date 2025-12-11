// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "hardhat/console.sol";

contract AgriChainPolicy {
    address public owner;
    address public oracle;

    struct Policy {
        address farmer;
        bytes32 indexId;
        uint256 threshold;
        uint256 startTimestamp;
        uint256 endTimestamp;
        uint256 premium;
        bool active;
        bool paidOut;
    }

    mapping(bytes32 => Policy[]) public policies;

    Policy[] public allPolicies;

    event PolicyCreated(
        uint256 policyId,
        address farmer,
        bytes32 indexId,
        uint256 threshold,
        uint256 premium
    );
    event OracleReportReceived(
        bytes32 indexId,
        uint256 rainfall,
        uint256 timestamp
    );
    event PayoutExecuted(uint256 policyId, address farmer, uint256 amount);

    constructor(address _oracle) {
        owner = msg.sender;
        oracle = _oracle;
    }

    function createPolicy(
        bytes32 _indexId,
        uint256 _threshold,
        uint256 _startTimestamp,
        uint256 _endTimestamp
    ) external payable {
        require(msg.value > 0, "Premium must be > 0");
        require(_endTimestamp > _startTimestamp, "Invalid duration");

        Policy memory newPolicy = Policy({
            farmer: msg.sender,
            indexId: _indexId,
            threshold: _threshold,
            startTimestamp: _startTimestamp,
            endTimestamp: _endTimestamp,
            premium: msg.value,
            active: true,
            paidOut: false
        });

        allPolicies.push(newPolicy);
        uint256 policyId = allPolicies.length - 1;

        emit PolicyCreated(
            policyId,
            msg.sender,
            _indexId,
            _threshold,
            msg.value
        );
    }

    function submitOracleReport(
        bytes32 _indexId,
        uint256 _rainfall,
        uint256 _timestamp,
        bytes memory _signature
    ) external {
        bytes32 messageHash = keccak256(
            abi.encodePacked(_indexId, _rainfall, _timestamp)
        );
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        address signer = recoverSigner(ethSignedMessageHash, _signature);

        require(signer == oracle, "Invalid oracle signature");

        emit OracleReportReceived(_indexId, _rainfall, _timestamp);

        for (uint256 i = 0; i < allPolicies.length; i++) {
            Policy storage p = allPolicies[i];

            if (p.active && !p.paidOut && p.indexId == _indexId) {
                if (
                    _timestamp >= p.startTimestamp &&
                    _timestamp <= p.endTimestamp
                ) {
                    if (_rainfall < p.threshold) {
                        _payout(i, p);
                    }
                }
            }
        }
    }

    function _payout(uint256 _policyId, Policy storage _p) internal {
        uint256 payoutAmount = _p.premium * 5;
        require(
            address(this).balance >= payoutAmount,
            "Insufficient contract funds"
        );

        _p.paidOut = true;
        _p.active = false;

        (bool success, ) = _p.farmer.call{value: payoutAmount}("");
        require(success, "Transfer failed");

        emit PayoutExecuted(_policyId, _p.farmer, payoutAmount);
    }

    function getEthSignedMessageHash(
        bytes32 _messageHash
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    "\x19Ethereum Signed Message:\n32",
                    _messageHash
                )
            );
    }

    function recoverSigner(
        bytes32 _ethSignedMessageHash,
        bytes memory _signature
    ) public pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(
        bytes memory sig
    ) public pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "Invalid signature length");
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }

    function withdraw() external {
        require(msg.sender == owner, "Only owner");
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }

    receive() external payable {}
}
