import React, { useState } from "react";
import CompleteShadowDOMWrapper from "./CompleteShadowDOMWrapper";
import SearchDropdown from "./SearchDropdown";

interface ShadowDOMTestProps {
  storeUrl?: string;
}

const ShadowDOMTest: React.FC<ShadowDOMTestProps> = ({ storeUrl }) => {
  const [useShadowDOM, setUseShadowDOM] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
  };

  const openModal = () => {
    setIsOpen(true);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>Shadow DOM vs Regular CSS Test</h2>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ marginRight: "10px" }}>
          <input
            type="checkbox"
            checked={useShadowDOM}
            onChange={(e) => setUseShadowDOM(e.target.checked)}
          />
          Use Shadow DOM
        </label>
      </div>

      <button
        onClick={openModal}
        style={{
          padding: "10px 20px",
          backgroundColor: "#823BED",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        Open Search Modal
      </button>

      {isOpen && (
        <>
          {useShadowDOM ? (
            <CompleteShadowDOMWrapper
              storeUrl={storeUrl}
              onClose={handleClose}
            />
          ) : (
            <SearchDropdown
              isOpen={isOpen}
              onClose={handleClose}
              storeUrl={storeUrl}
            />
          )}
        </>
      )}

      <div style={{ marginTop: "20px", fontSize: "14px", color: "#666" }}>
        <p>
          <strong>Shadow DOM:</strong> Complete CSS isolation, no theme
          interference
        </p>
        <p>
          <strong>Regular CSS:</strong> Uses CSS scoping with !important
          declarations
        </p>
      </div>
    </div>
  );
};

export default ShadowDOMTest;
