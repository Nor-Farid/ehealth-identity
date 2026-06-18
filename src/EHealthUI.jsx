import React, { useState, useEffect, useRef, useCallback } from "react";
import { ethers } from "ethers";
import { PinataSDK } from "pinata-web3";

import {
  CONTRACT_ADDRESS,
  SEPOLIA_CHAIN_ID,
  ADMIN_ROLE,
  VERIFIER_ROLE,
  CONTRACT_ABI
} from "./config/contract";

export default function EHealthUI() {
  // Global App States
  const [account, setAccount] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerifier, setIsVerifier] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchAddress, setSearchAddress] = useState("");
  const [searchDID, setSearchDID] = useState("");
  const [newHash, setNewHash] = useState("");
  const [stats, setStats] = useState(null);
  const [patientFile, setPatientFile] = useState(null);
  const [credentialFile, setCredentialFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Form Entry States
  const [registerForm, setRegisterForm] = useState({ 
    fullName: "", 
    bloodType: "" 
  });
  const [verifyAddress, setVerifyAddress] = useState("");
  const [credentialForm, setCredentialForm] = useState({ 
    patientAddress: "", 
    type: "Vaccination", 
    documentHash: "", 
    expiry: "" 
  });
  const [newVerifierAddress, setNewVerifierAddress] = useState("");

  // Blockchain Core Struct Data States
  const [identity, setIdentity] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const contractRef = useRef(null);

  const [lookupStatus, setLookupStatus] = useState(null);
  const [lookedUpAddress, setLookedUpAddress] = useState("");

  const searchAddressRef = useRef(searchAddress);
  useEffect(() => {
    searchAddressRef.current = searchAddress;
  }, [searchAddress]);

  // Pinata IPFS Initialization (SDK Fallback)
  const pinata = new PinataSDK({
    pinataJwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJjMDkyMWQzOS1lOTA1LTQ2OTItYWU2My1jMGFjMjlmZjJjYjgiLCJlbWFpbCI6Im5hZmlzLmFpbWFuLnJhemFsZWVAc3R1ZGVudC5tbXUuZWR1Lm15IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjgxOTY5ZWQ5NTkzNTgzNzVkNzYxIiwic2NvcGVkS2V5U2VjcmV0IjoiZjY2NzFjYmY1ZDUzYzFiZDVjYmM3MTAyNDI0M2E5ZWI3MDVkOWNiMDcxOGM5YmQxNmJhZjE0NjhkMzI5NWYyZiIsImV4cCI6MTgxMzMzMzY3Mn0.f8KUvRCsfoan2v7bWm0p-aW6iZIFg9LplBCnk2PTqMc",
    pinataGateway: "aquamarine-frequent-capybara-310.mypinata.cloud",
  });

  // Reusable Frontend Browser CORS Compliant Upload Pipeline
  const uploadToIPFS = async (file) => {
    if (!file) return null;
    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const pinataMetadata = JSON.stringify({
        name: file.name,
      });
      formData.append("pinataMetadata", pinataMetadata);

      const pinataOptions = JSON.stringify({
        cidVersion: 0,
      });
      formData.append("pinataOptions", pinataOptions);

      // Uses standard pinning endpoint to execute client-side front-end uploads smoothly
      const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Pinata Server Rejection Payload:", errorText);
        throw new Error(`HTTP Error ${response.status}`);
      }

      const data = await response.json();
      return data.IpfsHash;
    } catch (error) {
      console.error("IPFS Upload Error Stack:", error);
      alert("Failed to upload document to IPFS. Please verify your environment variables.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Reusable File Validation Handler (Type & Size Restrictions)
  const handleFileValidation = (file, fileInputEventTarget) => {
    if (!file) return null;
    
    // Allowed Mime Types/Extensions Check
    const allowedExtensions = ["pdf", "png", "jpg", "jpeg"];
    const fileExtension = file.name.split(".").pop().toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      alert("Invalid file type! Only PDF, PNG, JPG, and JPEG files are allowed.");
      fileInputEventTarget.value = ""; // Reset file selection input field
      return null;
    }

    // 5MB Size Validation (5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File is too large! Please upload a document smaller than 5MB.");
      fileInputEventTarget.value = ""; // Reset file selection input field
      return null;
    }

    return file;
  };

  // Setup Contract Instance
  const getContractInstance = async (useSigner = false) => {
    if (!window.ethereum) return null;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    if (useSigner) {
      const signer = provider.getSigner();
      return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    }
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  };

  // Fetch Global Stats
  const fetchStats = useCallback(async (contractInstance) => {
    try {
      const activeContract = contractInstance || contractRef.current;
      if (!activeContract) return;
      const [registered, verified] = await activeContract.getStats();
      setStats({ 
        registered: registered.toNumber(), 
        verified: verified.toNumber() 
      });
    } catch (e) {
      console.error("Error fetching stats:", e);
    }
  }, []);

  // Connect Metamask
  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask!");
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();
      const network = await provider.getNetwork();
      
      if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
        alert("Network Mismatch! Please switch MetaMask to Sepolia.");
        return;
      }

      setAccount(userAddress);
      await checkRoleAndFetchData(userAddress, provider);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Check Role and Fetch Data
  const checkRoleAndFetchData = async (userAddress, provider) => {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    contractRef.current = contract;
    try {
      const hasAdmin = await contract.hasRole(ADMIN_ROLE, userAddress);
      const hasVerifier = await contract.hasRole(VERIFIER_ROLE, userAddress);
      
      setIsAdmin(hasAdmin);
      setIsVerifier(hasVerifier);
    } catch (e) {
      console.error("Error evaluating RBAC roles:", e);
    }
    await fetchPatientData(userAddress, contract);
    await fetchStats(contract);
  };

  // Reusable core data-fetcher logic
  const fetchPatientData = async (targetAddress, contractInstance, isExplicitSearch = false) => {
    if (!ethers.utils.isAddress(targetAddress) || targetAddress === ethers.constants.AddressZero) {
      if (isExplicitSearch) {
        setLookedUpAddress(targetAddress);
        setLookupStatus("invalid");
        setIdentity(null);
        setCredentials([]);
      }
      return;
    }
    try {
      const registered = await contractInstance.isRegistered(targetAddress);
      if (!registered) {
        setIdentity(null);
        setCredentials([]);
        if (isExplicitSearch) {
          setLookedUpAddress(targetAddress);
          setLookupStatus("not_found");
        }
        return;
      }

      const idData = await contractInstance.getIdentity(targetAddress);
      if (idData && idData.did !== "") {
        setIdentity({
          owner: idData.owner,
          isVerified: idData.isVerified,
          did: idData.did,
          dataHash: idData.dataHash, 
          fullName: idData.fullName,
          bloodType: idData.bloodType,
          registeredAt: new Date(Number(idData.registeredAt) * 1000).toLocaleDateString()
        });

        const credData = await contractInstance.getCredentials(targetAddress);
        setCredentials(credData.map(c => ({
          type: c.credentialType,
          verifier: c.verifier,
          credentialHash: c.credentialHash,
          issuedAt: new Date(Number(c.issuedAt) * 1000).toLocaleDateString(),
          expiresAt: Number(c.expiresAt) === 0 
            ? "No Expiry" : new Date(Number(c.expiresAt) * 1000).toLocaleDateString(),
          isExpired: Number(c.expiresAt) !== 0 && Number(c.expiresAt) * 1000 < Date.now()
        })));

        if (isExplicitSearch) {
          setLookedUpAddress(targetAddress);
          setLookupStatus("found");
        }
      } else {
        setIdentity(null);
        setCredentials([]);
        if (isExplicitSearch) {
          setLookedUpAddress(targetAddress);
          setLookupStatus("not_found");
        }
      }
    } catch (e) {
      setIdentity(null);
      setCredentials([]);
      if (isExplicitSearch) {
        setLookedUpAddress(targetAddress);
        setLookupStatus("error");
      }
    }
  };

  // Metamask active account listener
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          checkRoleAndFetchData(accounts[0], provider);
        } else {
          setAccount("");
          setIdentity(null);
          setIsAdmin(false);
          setIsVerifier(false);
          setStats(null);
        }
      });
    }
  }, []);

  // Live Blockchain Event Monitoring Setup
  useEffect(() => {
    if (!window.ethereum || !account) return;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    contractRef.current = contract;

    const refreshIfRelevant = (patient) => {
      if (
        patient.toLowerCase() === account.toLowerCase() ||
        (searchAddressRef.current && patient.toLowerCase() === searchAddressRef.current.toLowerCase())
      ) {
        fetchPatientData(patient, contract);
      }
      fetchStats(contract);
    };

    contract.on("IdentityRegistered", refreshIfRelevant);
    contract.on("IdentityVerified", refreshIfRelevant);
    contract.on("CredentialIssued", refreshIfRelevant);
    contract.on("IdentityUpdated", refreshIfRelevant);

    contract.on("IdentityDeactivated", (patient) => {
      if (
        patient.toLowerCase() === account.toLowerCase() ||
        (searchAddressRef.current && patient.toLowerCase() === searchAddressRef.current.toLowerCase())
      ) {
        setIdentity(null);
        setCredentials([]);
      }
    });

    return () => {
      try {
        contract?.removeAllListeners();
      } catch (e) {
        console.error("Error removing listeners:", e);
      }
    };
  }, [account, fetchStats]);

  // Error handling helper for contract interactions
  const handleContractError = (error) => {
    const message = error?.data?.message || error?.message || "";
    if (message.includes("AlreadyRegistered")) {
      alert("This wallet address already has an identity registered.");
    } else if (message.includes("DIDTaken")) {
      alert("This DID is already taken. Try another identifier.");
    } else if (message.includes("NotRegistered")) {
      alert("No identity found for this address.");
    } else if (message.includes("NotVerified")) {
      alert("This identity is not verified by any hospital yet.");
    } else if (message.includes("AlreadyVerified")) {
      alert("This identity is already verified.");
    } else if (message.includes("CredentialExpired")) {
      alert("This credential has expired and is no longer valid.");
    } else if (error.code === 4001 || message.includes("user rejected")) {
      alert("Authorization Denied: You rejected the transaction.");
    } else {
      alert("Authorization Failed: " + message);
    }
  };

  // 🔵 PATIENT Actions: Register Identity
  const handleRegister = async (e) => {
    e.preventDefault();

    const contract = await getContractInstance(true);
    if (!contract) return;

    try {
      setLoading(true);
      let cid = "";

      if (patientFile) {
        cid = await uploadToIPFS(patientFile);
      } else {
        const emptyHistoryBlob = new Blob(
          [JSON.stringify({ 
            status: "Initial Registration Profile", 
            created: new Date().toISOString(),
            notes: "No prior medical history submitted during account initialization." 
          }, null, 2)],
          { type: "application/json" }
        );

        const defaultFile = new File([emptyHistoryBlob], "init_profile.json", { type: "application/json" });
        cid = await uploadToIPFS(defaultFile);
      }

      if (!cid) return;

      const did = `did:ehealth:${account.toLowerCase()}`;      
      const tx = await contract.registerIdentity(
        did,
        cid,  
        registerForm.fullName, 
        registerForm.bloodType
      );
      await tx.wait();

      alert("Identity registered successfully!");
      setRegisterForm({ fullName: "", bloodType: ""});
      setPatientFile(null);
    } catch (err) {
      handleContractError(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔵 PATIENT Actions: Update Health Data
  const handleUpdateHash = async (e) => {
    e.preventDefault();
    const contract = await getContractInstance(true);
    if (!contract) return;
    try {
      setLoading(true);
      const tx = await contract.updateDataHash(newHash);
      await tx.wait();
      alert("Health record hash updated successfully!");
      setNewHash("");
    } catch (err) {
      handleContractError(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔵 PATIENT Actions: Deactivate Identity
  const handleDeactivate = async () => {
    if (!window.confirm("CRITICAL WARNING: This will permanently wipe your on-chain identity and all associated data. This action cannot be undone. Proceed?")) return;
    const contract = await getContractInstance(true);
    if (!contract) return;
    try {
      setLoading(true);
      const tx = await contract.deactivateIdentity();
      await tx.wait();
      alert("Identity deactivated and removed from the chain.");
      setIdentity(null);
      setCredentials([]);
    } catch (err) {
      handleContractError(err);
    } finally {
      setLoading(false);
    }
  };

  // 🟢 GENERAL Actions: Address Search Lookup
  const handleLookup = async (e) => {
    e.preventDefault();
    
    const targetAddress = searchAddress.trim();
    if (!ethers.utils.isAddress(targetAddress) || targetAddress === ethers.constants.AddressZero) {
      alert("Please enter a valid wallet address to search.");
      return;
    }

    const contract = await getContractInstance(false);
    if (!contract) return;

    try {
      setLoading(true);
      setLookupStatus(null);

      searchAddressRef.current = targetAddress;
      setSearchAddress(targetAddress);

      await fetchPatientData(targetAddress, contract, true);
      setSearchAddress("");
    } catch (err) {
      handleContractError(err);
    } finally {
      setLoading(false);
    }
  };

  // 🟢 GENERAL Actions: DID Search Lookup
  const handleDIDResolve = async (e) => {
    e.preventDefault();
    if (!searchDID.trim()) return alert("Please enter a valid DID.");
    const contract = await getContractInstance(false);
    if (!contract) return;
    try {
      setLoading(true);
      const resolvedAddress = await contract.resolveDID(searchDID.trim());
      if (resolvedAddress === ethers.constants.AddressZero) {
        alert("This DID does not resolve to any active identity.");
        return;
      }
      searchAddressRef.current = resolvedAddress;
      setLookupStatus(null);
      await fetchPatientData(resolvedAddress, contract, true);
      setSearchDID("");
    } catch (err) {
      handleContractError(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔴 HOSPITAL Actions: Verify a Patient
  const handleVerify = async (e) => {
    e.preventDefault();
    const contract = await getContractInstance(true);
    if (!contract) return;
    try {
      setLoading(true);
      const tx = await contract.verifyIdentity(verifyAddress);
      await tx.wait();
      alert(`Patient ${verifyAddress} verified successfully!`);
      setSearchAddress(verifyAddress);
      searchAddressRef.current = verifyAddress;
      setVerifyAddress("");
    } catch (err) {
      handleContractError(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔴 HOSPITAL Actions: Issue a Health Credential
  const handleIssueCredential = async (e) => {
    e.preventDefault();

    let expiresAt = 0;
    if (credentialForm.expiry) {
      const ts = Math.floor(new Date(credentialForm.expiry).getTime() / 1000);
      if (isNaN(ts) || ts <= Math.floor(Date.now() / 1000)) {
        alert("Expiry date must be a valid future date.");
        return;
      }
      expiresAt = ts;
    }

    const contract = await getContractInstance(true);
    if (!contract) return;
    try {
      setLoading(true);
      let cid = "";

      if (credentialFile) {
        cid = await uploadToIPFS(credentialFile);
      } else {
        const fallbackCredBlob = new Blob(
          [JSON.stringify({
            status: "Standard Log Attestation",
            type: credentialForm.type,
            patient: credentialForm.patientAddress,
            issuedBy: account,
            timestamp: new Date().toISOString(),
            details: `A digital validation record of type ${credentialForm.type} was approved by authorized clinic metadata logging.`
          }, null, 2)],
          { type: "application/json" }
        );
        const fallbackFile = new File([fallbackCredBlob], "medical_attestation.json", { type: "application/json" });
        cid = await uploadToIPFS(fallbackFile);
      }

      if (!cid) return;

      const tx = await contract.issueCredential(
        credentialForm.patientAddress, 
        credentialForm.type, 
        cid, 
        expiresAt
      );
      await tx.wait();
      alert(`Secure ${credentialForm.type} credential issued successfully!`);
      setCredentialForm({ patientAddress: "", type: "Vaccination", expiry: "" });
      setCredentialFile(null);
    } catch (err) {
      handleContractError(err);
    } finally {
      setLoading(false);
    }
  };

  // 🟡 ADMIN Actions: Grant Verifier Access Rights
  const handleGrantVerifier = async (e) => {
    e.preventDefault();
    const contract = await getContractInstance(true);
    if (!contract) return;
    try {
      setLoading(true);
      const tx = await contract.grantVerifier(newVerifierAddress);
      await tx.wait();
      alert(`Success! ${newVerifierAddress} has been authorized as a verifier.`);
      setNewVerifierAddress("");
    } catch (err) {
      handleContractError(err);
    } finally {
      setLoading(false);
    }
  };

  // 🟡 ADMIN Actions: Revoke Verifier Privileges
  const handleRevokeVerifier = async (targetVerifier) => {
    if (!targetVerifier || !ethers.utils.isAddress(targetVerifier)) return alert("Please enter a valid wallet address to revoke.");
    if (!window.confirm(`Revoke verifier authority for ${targetVerifier}?`)) return;
    const contract = await getContractInstance(true);
    if (!contract) return;
    try {
      setLoading(true);
      const tx = await contract.revokeVerifier(targetVerifier);
      await tx.wait();
      alert(`Verifier authority successfully stripped from ${targetVerifier}.`);
      setNewVerifierAddress("");
    } catch (err) {
      handleContractError(err);
    } finally {
      setLoading(false);
    }
  };

  // UI Rendering
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "900px", margin: "0 auto" }}>
 
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #eaeaea", paddingBottom: "1rem", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>E-Health Identity Management System</h1>
          <small style={{ color: "#64748b" }}>
            Connected as: <code style={{ color: "#db2777", fontWeight: "bold" }}>{account || "Not connected"}</code>
          </small>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem" }}>
          {account && (
            <span style={{
              padding: "0.5rem 1rem",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: "bold",
              background: isAdmin ? "#fff9e6" : isVerifier ? "#e6f4ea" : "#e8f0fe",
              color: isAdmin ? "#b7950b" : isVerifier ? "#137333" : "#1a73e8",
            }}>
              {isAdmin ? "System Admin" : isVerifier ? "Hospital Staff" : "Patient"}
            </span>
          )}
          {stats && (
            <div style={{ fontSize: "0.75rem", color: "#64748b", textAlign: "right" }}>
              {stats.registered} registered · {stats.verified} verified
            </div>
          )}
        </div>
      </header>
 
      {!account ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "#f8f9fa", borderRadius: "12px", border: "1px dashed #ccc" }}>
          <h2>Welcome to the E-Health Identity Management System</h2>
          <p style={{ color: "#666", marginBottom: "1.5rem" }}>
            Connect your MetaMask wallet to authenticate your Decentralized Identity (DID) and access your healthcare records.
          </p>
          <button onClick={connectWallet} disabled={loading} style={{ padding: "0.75rem 2rem", fontSize: "1rem", fontWeight: "bold", background: "#661800", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            {loading ? "Connecting…" : "Connect MetaMask wallet"}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
 
          {/* Admin Panel */}
          {isAdmin && (
            <div style={{ background: "#fff9e6", padding: "2rem", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", border: "2px dashed #f5b041" }}>
              <h2 style={{ color: "#b7950b", marginTop: 0 }}>Healthcare Network Administration</h2>
              <p style={{ color: "#555" }}>Authorize or revoke healthcare provider access to the identity network.</p>
              <form onSubmit={handleGrantVerifier} style={{ display: "flex", gap: "1rem", alignItems: "end" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "bold" }}>Healthcare Provider Wallet Address</label>
                  <input
                    type="text"
                    placeholder="0x…"
                    required
                    value={newVerifierAddress}
                    onChange={e => setNewVerifierAddress(e.target.value)}
                    style={{ padding: "0.6rem", borderRadius: "4px", border: "1px solid #ccc" }}
                  />
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button type="submit" disabled={loading} style={{ padding: "0.6rem 1.5rem", background: "#b7950b", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                    Authorize Verifier
                  </button>
                  <button type="button" disabled={loading} onClick={() => handleRevokeVerifier(newVerifierAddress)} style={{ padding: "0.6rem 1.5rem", background: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                    Revoke Verifier
                  </button>
                </div>
              </form>
            </div>
          )}
 
          {/* Hospital Staff Panel */}
          {isVerifier && (
            <div style={{ background: "#fdfdfd", padding: "2rem", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", border: "1px solid #e6f4ea" }}>
              <h2 style={{ color: "#137333", marginTop: 0 }}>Hospital Administrative Dashboard</h2>
              <hr style={{ border: "0.5px solid #eaeaea", margin: "1.5rem 0" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>

                <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <h3>Verify Patient Identity</h3>
                  <input
                    type="text"
                    placeholder="Patient Wallet Address (0x…)"
                    required
                    value={verifyAddress}
                    onChange={e => setVerifyAddress(e.target.value)}
                    style={{ padding: "0.6rem", borderRadius: "4px", border: "1px solid #ccc" }}
                  />
                  <button type="submit" disabled={loading} style={{ padding: "0.6rem", background: "#137333", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                    Verify Patient Record
                  </button>
                </form>

                <form onSubmit={handleIssueCredential} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <h3>Issue Medical Credential</h3>
                  <input
                    type="text"
                    placeholder="Patient Wallet Address (0x…)"
                    required
                    value={credentialForm.patientAddress}
                    onChange={e => setCredentialForm({ ...credentialForm, patientAddress: e.target.value })}
                    style={{ padding: "0.6rem", borderRadius: "4px", border: "1px solid #ccc" }}
                  />
                  <select
                    value={credentialForm.type}
                    onChange={e => setCredentialForm({ ...credentialForm, type: e.target.value })}
                    style={{ padding: "0.6rem", borderRadius: "4px", border: "1px solid #ccc" }}
                  >
                    <option value="Vaccination">Vaccination Record</option>
                    <option value="Prescription">Medical Prescription</option>
                    <option value="LabResult">Laboratory Result</option>
                  </select>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#137333" }}>Upload Signed Medical Certificate (Optional)</label>
                    <input
                      type="file"
                      // Strict frontend filters for supported file extensions
                      accept=".pdf, .png, .jpg, .jpeg"
                      onChange={e => {
                        const file = e.target.files[0];
                        const validatedFile = handleFileValidation(file, e.target);
                        setCredentialFile(validatedFile);
                      }}
                      style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc", background: "#fff" }}
                    />
                    <small style={{ color: "#64748b", fontSize: "0.7rem" }}>Allowed: PDF, PNG, JPG under 5MB</small>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.8rem", color: "#555" }}>Expiry Date (leave blank for no expiry)</label>
                    <input
                      type="date"
                      value={credentialForm.expiry}
                      onChange={e => setCredentialForm({ ...credentialForm, expiry: e.target.value })}
                      style={{ padding: "0.6rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    />
                  </div>
                  <button type="submit" disabled={loading || uploading} style={{ padding: "0.6rem", background: "#0f5132", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                    {uploading ? "Uploading to IPFS..." : "Sign & Issue Medical Credential"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Identity Lookup Section */}
          <div style={{ background: "#ffffff", padding: "2rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <h3 style={{ color: "#1e3a8a", margin: 0 }}>Identity Lookup</h3>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>

                <form onSubmit={handleLookup} style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    placeholder="Search Wallet (0x…)"
                    value={searchAddress}
                    onChange={e => setSearchAddress(e.target.value)}
                    style={{ padding: "0.5rem", fontSize: "0.85rem", borderRadius: "6px", border: "1px solid #cbd5e1", width: "200px" }}
                  />
                  <button type="submit" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                    Search
                  </button>
                </form>

                <form onSubmit={handleDIDResolve} style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    placeholder="Search DID (did:ehealth:…)"
                    value={searchDID}
                    onChange={e => setSearchDID(e.target.value)}
                    style={{ padding: "0.5rem", fontSize: "0.85rem", borderRadius: "6px", border: "1px solid #cbd5e1", width: "220px" }}
                  />
                  <button type="submit" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", background: "#7c3aed", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                    Resolve
                  </button>
                </form>
              </div>
            </div>
 
            <hr style={{ border: "0", borderTop: "1px solid #f1f5f9", margin: "1.5rem 0" }} />
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "2rem" }}>
 
              {/* LEFT COLUMN: Identity Profile or Registration */}
              <div>
                {identity ? (
                  <div style={{ border: "2px solid #3b82f6", padding: "1.5rem", borderRadius: "8px", background: "#eff6ff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                      <h5 style={{ margin: 0, textTransform: "uppercase", color: "#1e40af" }}>DID Profile</h5>
                      <span style={{
                        fontSize: "0.7rem", padding: "0.25rem 0.5rem", borderRadius: "4px", fontWeight: "bold",
                        background: identity.isVerified ? "#d1fae5" : "#fee2e2",
                        color: identity.isVerified ? "#065f46" : "#991b1b",
                      }}>
                        {identity.isVerified ? "✅ Verified" : "⚠️ Unverified"}
                      </span>
                    </div>
 
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem" }}>
                      <p style={{ margin: 0 }}><strong>Name:</strong> {identity.fullName}</p>
                      <p style={{ margin: 0 }}><strong>Blood Type:</strong> {identity.bloodType}</p>
                      <p style={{ margin: 0 }}>
                        <strong>Record Hash:</strong>{" "}
                        <a href={`https://ipfs.io/ipfs/${identity.dataHash}`} target="_blank" rel="noreferrer" style={{ color: "#2563eb", textDecoration: "underline", fontWeight: "bold" }}>
                          View Document ↗
                        </a>
                      </p>
                      <p style={{ margin: 0, fontSize: "0.8rem" }}>
                        <strong>DID:</strong>
                        <code style={{ background: "#fff", padding: "4px", borderRadius: "4px", fontSize: "0.75rem", display: "block", marginTop: "4px", border: "1px solid #bfdbfe", overflowX: "auto" }}>
                          {identity.did}
                        </code>
                      </p>
                      <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.75rem", color: "#64748b" }}>
                        <strong>Registered:</strong> {identity.registeredAt}
                      </p>
                    </div>
 
                    {identity.owner.toLowerCase() === account.toLowerCase() && !isAdmin && !isVerifier && (
                      <>
                        <form onSubmit={handleUpdateHash} style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem", borderTop: "1px dashed #bfdbfe", paddingTop: "1rem" }}>
                          <label style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#1e40af" }}>Update Health Record Hash</label>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <input
                              type="text"
                              placeholder="New IPFS hash (Qm…)"
                              required
                              value={newHash}
                              onChange={e => setNewHash(e.target.value)}
                              style={{ flex: 1, padding: "0.4rem", borderRadius: "4px", border: "1px solid #bfdbfe", fontSize: "0.8rem" }}
                            />
                            <button type="submit" disabled={loading} style={{ padding: "0.4rem 0.8rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}>
                              Update
                            </button>
                          </div>
                        </form>

                        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #bfdbfe", display: "flex", justifyContent: "flex-end" }}>
                          <button onClick={handleDeactivate} disabled={loading} style={{ background: "#ef4444", color: "#fff", padding: "0.4rem 1rem", border: "none", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "bold", cursor: "pointer" }}>
                            Deactivate &amp; Delete Identity
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  !isAdmin && !isVerifier && (
                    <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", background: "#f8fafc", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <h4 style={{ margin: 0, color: "#334155" }}>Register New Patient Profile</h4>
                      <input
                        type="text"
                        placeholder="Full Legal Name"
                        required
                        value={registerForm.fullName}
                        onChange={e => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                        style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                      />
                      <input
                        type="text"
                        placeholder="Blood Type (e.g. O+, AB-)"
                        required
                        value={registerForm.bloodType}
                        onChange={e => setRegisterForm({ ...registerForm, bloodType: e.target.value })}
                        style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                      />
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <label style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#334155" }}>Medical History PDF/Doc</label>
                        <input
                          type="file"
                          // Strict frontend filters for supported file extensions
                          accept=".pdf, .png, .jpg, .jpeg"
                          onChange={e => {
                            const file = e.target.files[0];
                            const validatedFile = handleFileValidation(file, e.target);
                            setPatientFile(validatedFile);
                          }}
                          style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #cbd5e1", background: "#fff" }}
                        />
                        <small style={{ color: "#64748b", fontSize: "0.7rem" }}>Allowed: PDF, PNG, JPG under 5MB</small>
                      </div>
                      <button type="submit" disabled={loading || uploading} style={{ padding: "0.6rem", background: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                        {uploading ? "Uploading to IPFS..." : "Register New Patient"}
                      </button>
                    </form>
                  )
                )}
              </div>
 
              {/* RIGHT COLUMN: Medical Credentials Display */}
              <div>
                {(!isAdmin && !isVerifier) || identity ? (
                  <>
                    <h4 style={{ marginTop: 0, color: "#334155" }}>Medical Credentials</h4>
                    {credentials.length === 0 ? (
                      <p style={{ color: "#94a3b8", fontSize: "0.85rem", fontStyle: "italic" }}>
                        No credentials issued to this address yet.
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "360px", overflowY: "auto" }}>
                        {credentials.map((c, i) => (
                          <div key={i} style={{
                            border: `1px solid ${c.isExpired ? "#fca5a5" : "#e2e8f0"}`,
                            padding: "1rem",
                            borderRadius: "6px",
                            background: c.isExpired ? "#fff5f5" : "#fff",
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                              <span style={{ fontWeight: "bold", color: "#1e3a8a", fontSize: "0.9rem" }}>{c.type}</span>
                              {c.isExpired && (
                                <span style={{ fontSize: "0.7rem", background: "#fee2e2", color: "#991b1b", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>
                                  Expired
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#475569" }}>
                              \ **Issued by:** <code style={{ color: "#059669" }}>{c.verifier}</code>
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "0.2rem" }}>
                              <strong>Document Hash:</strong>{" "}
                              <a href={`https://ipfs.io/ipfs/${c.credentialHash}`} target="_blank" rel="noreferrer" style={{ color: "#059669", fontWeight: "bold", textDecoration: "underline" }}>
                                Open Secure Link ↗
                              </a>
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                              Issued: {c.issuedAt} · Expires: {c.expiresAt}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ color: "#94a3b8", fontSize: "0.85rem", fontStyle: "italic" }}>
                    Search for a patient profile above to display active medical credentials.
                  </p>
                )}
              </div>

            </div>
          </div>
 
        </div>
      )}
    </div>
  );
}