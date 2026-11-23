import React, { createContext, useContext, useState } from "react";

import ImageViewer from "../components/ImageViewer";

interface ImageViewerContextType {
  openImage: (uri: string) => void;
  closeImage: () => void;
  selectedImage: string | undefined;
  imageToSend: any;
  imageCaption: string;
  openImagePreview: (image: any) => void;
  closeImagePreview: () => void;
  setImageCaption: React.Dispatch<React.SetStateAction<string>>;
  openDocumentPreview: (document: any) => void;
  closeDocumentPreview: () => void;
  documentToSend: any;
}

const ImageViewerContext = createContext<ImageViewerContextType | undefined>(
  undefined,
);

export const ImageViewerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [selectedImage, setSelectedImage] = useState<string | undefined>(
    undefined,
  );

  const [imageToSend, setImageToSend] = useState<any>(null);
  const [imageCaption, setImageCaption] = useState("");

  //For Document Preview
  const [documentToSend, setDocumentToSend] = useState<any>(null);

  const openDocumentPreview = (document: any) => {
    setDocumentToSend(document);
  };

  const closeDocumentPreview = () => {
    setDocumentToSend(null);
  };

  const openImagePreview = (image: any) => {
    setImageToSend(image);
    setImageCaption("");
  };

  const closeImagePreview = () => {
    setImageToSend(null);
    setImageCaption("");
  };

  const openImage = (uri: string | undefined) => {
    console.log("Opening image:", uri);
    setSelectedImage(uri);
  };

  const closeImage = () => {
    setSelectedImage(undefined);
  };

  return (
    <ImageViewerContext.Provider
      value={{
        openImage,
        closeImage,
        selectedImage,
        imageToSend,
        imageCaption,
        openImagePreview,
        closeImagePreview,
        setImageCaption,
        openDocumentPreview,
        closeDocumentPreview,
        documentToSend,
      }}
    >
      {children}

      <ImageViewer
        visible={!!selectedImage}
        imageUri={selectedImage ?? undefined}
        onClose={closeImage}
      />
    </ImageViewerContext.Provider>
  );
};

export const useImageViewer = () => {
  const context = useContext(ImageViewerContext);

  if (!context) {
    throw new Error("useImageViewer must be used inside ImageViewerProvider");
  }

  return context;
};
