import React from 'react';
import { FlatList, Image, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { Theme } from '../../../common/theme';
import AppText from '../../../components/Text/AppText';
import images from '../../../assets/images';
import moment from 'moment';
import { PostLikeUser } from '../../../features/cummunity/types';

interface Props {
  likes: PostLikeUser[];
  isLoading?: boolean;
}

const LikesListView: React.FC<Props> = ({ likes, isLoading }) => {
  const { colors, spacing, fonts } = useTheme();
  const styles = useStyles(colors, spacing, fonts);

  const renderLikeItem = ({ item }: { item: PostLikeUser }) => (
    <View style={styles.likeItem}>
      <Image
        source={
          item?.userPhotoUrl
            ? { uri: item.userPhotoUrl }
            : images.gallery_rounded
        }
        style={styles.avatar}
        defaultSource={images.gallery_rounded}
        resizeMode="cover"
      />
      <View style={styles.userInfo}>
        <AppText fontWeight="medium" size={14}>
          {item?.userName}
        </AppText>
        {item?.userLocation && (
          <AppText size={12} color={colors.caption}>
            {item.userLocation}
          </AppText>
        )}
        <AppText size={11} color={colors.caption}>
          {moment(item.likedAt).fromNow()}
        </AppText>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={likes}
        renderItem={renderLikeItem}
        keyExtractor={(item, index) => item.userId || index.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default LikesListView;

const useStyles = (
  colors: Theme['colors'],
  spacing: Theme['spacing'],
  fonts: Theme['fonts'],
) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    listContent: {
      paddingVertical: spacing.sm,
    },
    likeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: spacing.md,
    },
    userInfo: {
      flex: 1,
      gap: 4,
    },
  });

