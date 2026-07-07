import { MaterialCommunityIcons } from "@expo/vector-icons";
const getStatusIcon = (status) => {
  switch (status) {
    case "sent":
      return <MaterialCommunityIcons name="check" size={16} color="gray" />; // Single Tick
    case "delivered":
      return <MaterialCommunityIcons name="check-all" size={16} color="gray" />; // Double Tick Grey
    case "read":
      return (
        <MaterialCommunityIcons name="check-all" size={16} color="#34B7F1" />
      ); // Double Tick Blue
    default:
      return (
        <MaterialCommunityIcons name="clock-outline" size={16} color="gray" />
      ); // Sending...
  }
};

export default getStatusIcon;
