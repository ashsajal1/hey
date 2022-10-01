import { useQuery } from '@apollo/client';
import SingleNFT from '@components/NFT/SingleNFT';
import NFTSShimmer from '@components/Shared/Shimmer/NFTSShimmer';
import { EmptyState } from '@components/UI/EmptyState';
import { ErrorMessage } from '@components/UI/ErrorMessage';
import { Spinner } from '@components/UI/Spinner';
import { NftFeedDocument, Profile } from '@generated/types';
import { CollectionIcon } from '@heroicons/react/outline';
import { Mixpanel } from '@lib/mixpanel';
import React, { FC } from 'react';
import { useInView } from 'react-cool-inview';
import { CHAIN_ID, IS_MAINNET, PAGINATION_ROOT_MARGIN } from 'src/constants';
import { PAGINATION } from 'src/tracking';
import { chain } from 'wagmi';

interface Props {
  profile: Profile;
}

const NFTFeed: FC<Props> = ({ profile }) => {
  // Variables
  const request = {
    chainIds: [CHAIN_ID, IS_MAINNET ? chain.mainnet.id : chain.kovan.id],
    ownerAddress: profile?.ownedBy,
    limit: 10
  };

  const { data, loading, error, fetchMore } = useQuery(NftFeedDocument, {
    variables: { request },
    skip: !profile?.ownedBy
  });

  const nfts = data?.nfts?.items;
  const pageInfo = data?.nfts?.pageInfo;

  const { observe } = useInView({
    onChange: async ({ inView }) => {
      if (!inView) {
        return;
      }

      await fetchMore({
        variables: { request: { ...request, cursor: pageInfo?.next } }
      });
      Mixpanel.track(PAGINATION.NFT_FEED);
    },
    rootMargin: PAGINATION_ROOT_MARGIN
  });

  return (
    <>
      {loading && <NFTSShimmer />}
      {nfts?.length === 0 && (
        <EmptyState
          message={
            <div>
              <span className="mr-1 font-bold">@{profile?.handle}</span>
              <span>doesn’t have any NFTs!</span>
            </div>
          }
          icon={<CollectionIcon className="w-8 h-8 text-brand" />}
        />
      )}
      <ErrorMessage title="Failed to load nft feed" error={error} />
      {!error && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {nfts?.map((nft: any) => (
              <div key={`${nft?.chainId}_${nft?.contractAddress}_${nft?.tokenId}`}>
                <SingleNFT nft={nft} />
              </div>
            ))}
          </div>
          {pageInfo?.next && nfts?.length !== pageInfo.totalCount && (
            <span ref={observe} className="flex justify-center p-5">
              <Spinner size="sm" />
            </span>
          )}
        </>
      )}
    </>
  );
};

export default NFTFeed;
