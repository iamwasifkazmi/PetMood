import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useDispatch } from 'react-redux';
import icons from '../../../assets/icons/icons';
import { Theme } from '../../../common/theme';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import CardView from '../../../components/cards/CardView';
import PetListCard from '../../../components/cards/AnimalListCard';
import Header from '../../../components/header/Header';
import PrimaryInput from '../../../components/inputs/PrimaryInput';
import AppText from '../../../components/Text/AppText';
import { useGetAllProfilesQuery } from '../../../features/pet/petApiSlice';
import { setUser } from '../../../features/user/userSlice';
import { useGetUserDataQuery } from '../../../features/user/userApiSlice';
import { useTheme } from '../../../hooks/useTheme';
import { useSubscription } from '../../../hooks/useSubscription';
import { HomeProps, RouteName } from '../../../navigation/types';
import {
  addPetButtonTitle,
  isAddPetButtonDisabled,
  profilesUsageLabel,
} from '../../../utils/subscriptionQuotas';
import { navigateToSubscription } from '../../../utils/navigateToSubscription';
import EmptyView from './EmptyView';

const Home = ({ navigation }: HomeProps) => {
  const { colors, spacing } = useTheme();
  const styles = useStyles(colors, spacing);
  const { quotas, canAddPet, refetchStatus } = useSubscription();
  const [searchQuery, setSearchQuery] = useState('');
  const dispatch = useDispatch();

  const { data, refetch, isFetching, isLoading, isUninitialized } =
    useGetAllProfilesQuery(searchQuery ? { search: searchQuery } : undefined);
  const { data: userData } = useGetUserDataQuery();

  useEffect(() => {
    dispatch(setUser(userData ?? null));
    void refetchStatus();
  }, [userData, dispatch, refetchStatus]);

  const petsReady = !isUninitialized && !isLoading;
  const petCount = data?.length ?? 0;
  const showEmpty = petsReady && !isFetching && petCount === 0;
  const showPets = petsReady && petCount > 0;

  return (
    <View style={{ flex: 1 }}>
      <Header />
      <ScrollView
        contentContainerStyle={{
          padding: spacing.padding,
          paddingBottom: spacing.padding + 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <AppText variant="subheading" style={{ marginBottom: 8 }}>
          Home
        </AppText>
        <AppText variant="body" color={colors.caption} style={{ marginBottom: 20 }}>
          Welcome back{userData?.name ? `, ${userData.name}` : ''}! Track your pets
          and start a new emotion scan.
        </AppText>

        <PrimaryInput
          leftImageSource={icons.search}
          placeholder="Search pets..."
          containerStyle={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {profilesUsageLabel(quotas) ? (
          <AppText
            size={13}
            color={colors.caption}
            style={{ textAlign: 'center', marginBottom: 16 }}
          >
            {profilesUsageLabel(quotas)}
            {quotas?.profilesRemaining != null
              ? ` · ${quotas.profilesRemaining} remaining`
              : ''}
          </AppText>
        ) : null}

        <View style={styles.actionsCol}>
          <PrimaryButton
            title="Start Scan"
            onPress={() => navigation.navigate(RouteName.Scanner)}
          />
          <PrimaryButton
            type="outlined"
            title={addPetButtonTitle(quotas)}
            disabled={isAddPetButtonDisabled(quotas)}
            onPress={() => {
              if (!canAddPet) {
                if (isAddPetButtonDisabled(quotas)) return;
                navigateToSubscription(navigation as any);
                return;
              }
              navigation.navigate(RouteName.Profile, { openAddForm: true });
            }}
            style={{ marginTop: 12 }}
          />
        </View>

        {!petsReady || (isFetching && !data) ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} />
            <AppText color={colors.caption} style={{ marginTop: 8 }}>
              Loading pets…
            </AppText>
          </View>
        ) : null}

        {showEmpty ? (
          <CardView>
            <EmptyView />
          </CardView>
        ) : null}

        {showPets ? (
          <>
            <AppText variant="heading" style={{ marginBottom: 12 }}>
              Your Pets ({petCount})
            </AppText>
            <PetListCard
              onPressItem={() => navigation.navigate(RouteName.Profile)}
              ANIMAL_DATA={data || []}
              refetch={refetch}
              isFetching={isFetching}
            />
          </>
        ) : null}

        <PrimaryButton
          type="outlined"
          title="View Scan History"
          onPress={() => navigation.navigate(RouteName.History)}
          style={{ marginTop: 24 }}
        />
      </ScrollView>
    </View>
  );
};

export default Home;

const useStyles = (colors: Theme['colors'], spacing: Theme['spacing']) =>
  StyleSheet.create({
    searchInput: {
      borderRadius: 50,
      borderColor: colors.border,
      marginBottom: 16,
    },
    actionsCol: {
      marginBottom: 24,
    },
    loadingBox: {
      alignItems: 'center',
      paddingVertical: 32,
    },
  });
