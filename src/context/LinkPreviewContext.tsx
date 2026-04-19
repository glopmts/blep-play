import React, { createContext, useContext, useState } from "react";

// Define se estamos no modo preview ou não
const LinkPreviewContext = createContext<{ isPreview: boolean }>({
  isPreview: false,
});

export const LinkPreviewContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // Aqui você pode integrar lógica adicional se necessário,
  // mas o básico é fornecer o contexto para os componentes filhos.
  const [isPreview] = useState(false);

  return (
    <LinkPreviewContext.Provider value={{ isPreview }}>
      {children}
    </LinkPreviewContext.Provider>
  );
};

// Hook para usar em qualquer tela (ex: player.tsx)
export const useIsLinkPreview = () => useContext(LinkPreviewContext);
