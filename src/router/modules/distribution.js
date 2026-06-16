// +----------------------------------------------------------------------
// | CRMEB [ CRMEB赋能开发者，助力企业发展 ]
// +----------------------------------------------------------------------
// | Copyright (c) 2016~2025 https://www.crmeb.com All rights reserved.
// +----------------------------------------------------------------------
// | Licensed CRMEB并不是自由软件，未经许可不能去掉CRMEB相关版权
// +----------------------------------------------------------------------
// | Author: CRMEB Team <admin@crmeb.com>
// +----------------------------------------------------------------------

import Layout from '@/layout';

const distributionRouter = {
  path: '/distribution',
  component: Layout,
  redirect: '/distribution/distributionconfig',
  name: 'Distribution',
  meta: {
    title: '分销',
    icon: 'clipboard',
  },
  children: [
    {
      path: 'index',
      component: () => import('@/views/distribution/index'),
      name: 'distributionIndex',
      meta: { title: '分销员管理', icon: '' },
    },
    {
      path: 'distributionconfig',
      component: () => import('@/views/distribution/config/index'),
      name: 'distributionConfig',
      meta: { title: '分销配置', icon: '' },
    },
    {
      path: 'multiLevelRebate',
      component: () => import('@/views/distribution/multiLevelRebate/index'),
      name: 'multiLevelRebateConfig',
      meta: { title: '多级返佣配置', icon: '' },
    },
    {
      path: 'brokerageConfig',
      component: () => import('@/views/distribution/brokerageConfig/index'),
      name: 'brokerageConfig',
      meta: { title: '会员返佣配置', icon: '' },
    },
    {
      path: 'teamGrade',
      component: () => import('@/views/distribution/teamGrade/index'),
      name: 'TeamGrade',
      meta: { title: '团队等级', icon: '' },
    },
    {
      path: 'teamLevelConfig',
      component: () => import('@/views/distribution/teamLevelConfig/index'),
      name: 'TeamLevelConfig',
      meta: { title: '团队等级配置', icon: '' },
    },
  ],
};

export default distributionRouter;
