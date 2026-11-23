'use client';

import NextImage from 'next/image';
import type { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

// 统一图片组件：
// - 本地相对路径（/images/xxx）走 next/image，享受优化
// - 在线链接（http/https）与本地上传的 dataURL 走原生 img，绕开 next/image 的域名白名单限制
// 用法与 next/image 一致（支持 fill），调用方无需关心图片来源。
type Props = Omit<ImageProps, 'src'> & { src: string };

export function SmartImage({ src, alt, fill, className, sizes, priority, ...rest }: Props) {
  const isRemote = /^(https?:)?\/\//.test(src) || src.startsWith('data:');

  if (isRemote) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={alt}
        className={cn(className, fill && 'absolute inset-0 h-full w-full')}
        loading={priority ? 'eager' : 'lazy'}
      />
    );
  }

  return (
    <NextImage src={src} alt={alt} fill={fill} className={className} sizes={sizes} priority={priority} {...rest} />
  );
}
