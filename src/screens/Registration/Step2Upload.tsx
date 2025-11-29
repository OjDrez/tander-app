import UploadBox from "@/src/components/forms/UploadBox";
import ProgressBar from "@/src/components/ui/ProgressBar";
import { useFormikContext } from "formik";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ⬅️ IMPORTANT: Typed navigation import
import { Step2Nav } from "@/src/navigation/NavigationTypes";

interface Props {
  navigation: Step2Nav;
}

export default function Step2Upload({ navigation }: Props) {
  const { values, setFieldValue } = useFormikContext<any>();

  return (
    <ScrollView style={styles.container}>
      <ProgressBar step={2} total={3} />
      <Text style={styles.step}>Step 2 of 3</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Upload Photos</Text>

        <UploadBox
          count={6}
          onAddPhoto={(photo: string) =>
            setFieldValue("photos", [...values.photos, photo])
          }
        />
      </View>

      <View style={styles.footer}>
        {/* BACK BUTTON */}
        <TouchableOpacity
          style={styles.back}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* NEXT BUTTON */}
        <TouchableOpacity
          style={styles.next}
          onPress={() => navigation.navigate("Step3")}
        >
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  step: { marginBottom: 10, fontSize: 14 },
  card: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    marginBottom: 30,
  },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  footer: { flexDirection: "row", justifyContent: "space-between" },
  back: { paddingVertical: 14, paddingHorizontal: 20 },
  backText: { color: "#222", fontSize: 16 },
  next: {
    backgroundColor: "#F5A14B",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
  },
  nextText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
