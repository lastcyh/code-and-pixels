<script lang="ts">
    import { onMount } from 'svelte';

    export let slug: string;
    
    let likes = 0;
    let liked = false;
    let loading = true;

    onMount(async () => {
        try {
            // 获取初始数据
            const res = await fetch(`/api/stats?slug=${slug}`);
            if (res.ok) {
                const data = await res.json();
                likes = data.likes;
            }
            
            // 检查本地存储是否已点赞
            const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '[]');
            if (likedPosts.includes(slug)) {
                liked = true;
            }
        } catch (e) {
            console.error('Failed to fetch likes', e);
        } finally {
            loading = false;
        }
    });

    async function handleLike() {
        if (liked) return; // 防止重复点赞

        // 乐观更新
        likes++;
        liked = true;
        
        // 保存到本地存储
        const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '[]');
        if (!likedPosts.includes(slug)) {
            likedPosts.push(slug);
            localStorage.setItem('liked_posts', JSON.stringify(likedPosts));
        }

        try {
            await fetch(`/api/stats?slug=${slug}&action=like`, { method: 'POST' });
        } catch (e) {
            console.error('Failed to update likes', e);
            // 回滚状态
            likes--;
            liked = false;
            // 回滚本地存储
            const currentLikedPosts = JSON.parse(localStorage.getItem('liked_posts') || '[]');
            const index = currentLikedPosts.indexOf(slug);
            if (index > -1) {
                currentLikedPosts.splice(index, 1);
                localStorage.setItem('liked_posts', JSON.stringify(currentLikedPosts));
            }
        }
    }
</script>

<button 
    class="group flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 active:scale-95"
    class:bg-[var(--card-bg)]={!liked}
    class:text-[var(--primary)]={!liked}
    class:hover:bg-[var(--primary)]={!liked}
    class:hover:text-white={!liked}
    class:bg-[var(--primary)]={liked}
    class:text-white={liked}
    on:click={handleLike}
    disabled={liked || loading}
    aria-label="Like this post"
>
    <div class="relative w-5 h-5">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 transition-transform duration-300 group-hover:scale-110" class:scale-110={liked}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        {#if liked}
            <span class="absolute inset-0 animate-ping opacity-75 rounded-full bg-white"></span>
        {/if}
    </div>
    <span class="font-medium">{likes}</span>
</button>
