// ===========================================================================
// STAFF AND SHARING
// ---------------------------------------------------------------------------
// Who else can open this shop, and what each of them is allowed to do.
//
// The roles are not decoration. A counter assistant who can bill but cannot
// delete a bill or see the month's profit is the difference between a useful
// second pair of hands and a hole in the books.
//
// Adding somebody is NOT possible yet - the server has no endpoint for it -
// and this screen says so plainly rather than offering a button that fails.
// An invite that silently does nothing is worse than an honest gap.
// ===========================================================================

import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Card, Divider, ErrorState, Loading, Note, Row, Screen, T } from "../../components/ui";
import { Icon } from "../../components/icons";
import { useSession } from "../../lib/session";
import { listMembers } from "../../lib/data";
import { colors, radius, space } from "../../lib/theme";

const ROLES = {
  owner: {
    label: "Owner",
    can: "Everything, including deleting bills, changing prices and seeing profit.",
  },
  manager: {
    label: "Manager",
    can: "Everything day to day, plus deleting bills and editing items. Cannot remove the shop.",
  },
  staff: {
    label: "Staff",
    can: "Make bills, take payments, add customers and items. Cannot delete anything or see profit.",
  },
  viewer: { label: "Viewer", can: "Can look, cannot change anything." },
};

export default function Staff() {
  const { businessId, user } = useSession();
  const [rows, setRows] = useState([]);
  const [state, setState] = useState({ loading: true, error: null });

  const load = useCallback(async () => {
    if (!businessId) return;
    try {
      setRows(await listMembers(businessId));
      setState({ loading: false, error: null });
    } catch (e) {
      setState({ loading: false, error: e });
    }
  }, [businessId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (state.loading) return <Loading />;
  if (state.error) return <ErrorState error={state.error} onRetry={load} />;

  return (
    <Screen>
      <Card pad={false}>
        {rows.length === 0 ? (
          <View style={{ padding: space(5) }}>
            <T variant="tiny" style={{ textAlign: "center" }}>
              Just you, for now.
            </T>
          </View>
        ) : (
          rows.map((m, i) => {
            const role = ROLES[m.role] || { label: m.role, can: "" };
            const you = m.isYou || String(m.phone) === String(user?.phone);
            return (
              <View key={m.id}>
                {i ? <Divider /> : null}
                <Row style={st.row}>
                  <View style={st.mark}>
                    <Icon name="user" size={18} color={colors.brandInk} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Row gap={1.5}>
                      <T numberOfLines={1} style={{ fontWeight: "650" }}>
                        {m.name || m.phone || "Somebody"}
                      </T>
                      {you ? (
                        <View style={st.tag}>
                          <T variant="tiny" style={{ color: colors.brandInk, fontWeight: "700" }}>
                            you
                          </T>
                        </View>
                      ) : null}
                    </Row>
                    <T variant="tiny">{[role.label, m.phone].filter(Boolean).join(" · ")}</T>
                    {!m.isActive ? (
                      <T variant="tiny" style={{ color: colors.danger }}>
                        No longer has access
                      </T>
                    ) : null}
                  </View>
                </Row>
              </View>
            );
          })
        )}
      </Card>

      <Note tone="info" title="Adding somebody" style={{ marginTop: space(5) }}>
        Inviting staff is not switched on yet. When it is, you will send a phone number from here and they
        will sign in with their own one-time code — no shared password, and you can take the access away
        again without changing anything else.
      </Note>

      <Card style={{ marginTop: space(5) }}>
        <T variant="label" style={{ marginBottom: space(2) }}>
          What each role can do
        </T>
        {Object.entries(ROLES).map(([key, r]) => (
          <View key={key} style={{ marginTop: space(2) }}>
            <T style={{ fontWeight: "650" }}>{r.label}</T>
            <T variant="tiny">{r.can}</T>
          </View>
        ))}
      </Card>

      <Note tone="warn" title="One login per person" style={{ marginTop: space(5) }}>
        Sharing one phone number between the counter and the owner means every bill looks like it was made
        by the same person, and there is no way to tell who cancelled one.
      </Note>
    </Screen>
  );
}

const st = StyleSheet.create({
  row: { paddingHorizontal: space(4), paddingVertical: space(3.5), gap: space(3) },
  mark: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  tag: {
    paddingHorizontal: space(1.5),
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: colors.brandSoft,
  },
});
