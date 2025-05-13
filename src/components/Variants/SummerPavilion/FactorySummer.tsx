import React from "react";

interface FactorySummerProps {
  factoryId: number;
}

const FactorySummer: React.FC<FactorySummerProps> = ({ factoryId }) => {
  // TODO: Récupérer la fabrique, afficher les tuiles hexagonales
  return (
    <div className="factory-summer">
      Fabrique {factoryId + 1} (Summer Pavilion)
      {/* TODO: Affichage des tuiles hexagonales */}
    </div>
  );
};

export default FactorySummer; 