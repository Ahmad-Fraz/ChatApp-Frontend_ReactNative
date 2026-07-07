import React from "react";
import { TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const AttachmentButton = ({ onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <MaterialCommunityIcons name="paperclip" size={26} color="#555" />
    </TouchableOpacity>
  );
};

export default React.memo(AttachmentButton);
