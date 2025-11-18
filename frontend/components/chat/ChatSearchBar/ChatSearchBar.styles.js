import { StyleSheet } from 'react-native';
import { SPACING, BORDER_RADIUS } from '../../../constants';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  closeButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  closeIcon: {
    fontSize: 14,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  resultCount: {
    fontSize: 12,
    marginRight: SPACING.xs,
    minWidth: 40,
    textAlign: 'center',
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default styles;

